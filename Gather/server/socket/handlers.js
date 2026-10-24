import { MAP_COLS, MAP_ROWS, TILE_SIZE, PROXIMITY_RADIUS, ALLOWED_REACTIONS, AVATAR_STYLES } from "../shared/constants.js";
import { isWalkable, getRandomSpawn } from "../game/map.js";
import { isTileBlockedByFurniture, getFurnitureState, placeFurniture, removeFurniture } from "../game/furniture.js";
import { getConversationsState, createConversation, addToConversation, removeFromConversation, broadcastConvUpdate, getConversation, isInConversation } from "../game/conversations.js";

const players = new Map();

export function registerHandlers(io, map) {
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("player:join",     onPlayerJoin(socket, io, map));
    socket.on("player:move",     onPlayerMove(socket, io, map));
    socket.on("player:reaction", onPlayerReaction(socket, io));
    socket.on("conv:start",      onConvStart(socket, io));
    socket.on("conv:request",    onConvRequest(socket, io));
    socket.on("conv:approve",    onConvApprove(socket, io));
    socket.on("conv:deny",       onConvDeny(socket, io));
    socket.on("conv:leave",      onConvLeave(socket, io));
    socket.on("furniture:place", onFurniturePlace(socket, io, map));
    socket.on("furniture:remove",onFurnitureRemove(socket, io));
    socket.on("webrtc:signal",   (d) => io.to(d.to).emit("webrtc:signal",  { from: socket.id, signal: d.signal }));
    socket.on("webrtc:request",  (d) => io.to(d.to).emit("webrtc:request", { from: socket.id }));
    socket.on("webrtc:end",      (d) => io.to(d.to).emit("webrtc:end",     { from: socket.id }));
    socket.on("disconnect",      onDisconnect(socket, io));
  });
}

// ── Handler factories ────────────────────────────────────────────

function onPlayerJoin(socket, io, map) {
  return (data) => {
    const spawn = getRandomSpawn(map);
    const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const player = { id: socket.id, name: data.name?.trim() || "Anonymous", x: spawn.x, y: spawn.y, style, direction: "down" };
    players.set(socket.id, player);

    socket.emit("game:init", {
      map, mapCols: MAP_COLS, mapRows: MAP_ROWS, tileSize: TILE_SIZE,
      proximityRadius: PROXIMITY_RADIUS, playerId: socket.id,
      players: Object.fromEntries(players),
      conversations: getConversationsState(players),
      furniture: getFurnitureState(),
    });
    socket.broadcast.emit("player:joined", player);
    console.log(`${player.name} joined at (${spawn.x}, ${spawn.y})`);
  };
}

function onPlayerMove(socket, io, map) {
  return (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    const nx = player.x + data.dx;
    const ny = player.y + data.dy;
    if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS
      && isWalkable(map[ny][nx]) && !isTileBlockedByFurniture(nx, ny)) {
      player.x = nx; player.y = ny;
      player.direction = data.direction || player.direction;
      socket.broadcast.emit("player:moved", { id: socket.id, x: nx, y: ny, direction: player.direction });
    }
  };
}

function onPlayerReaction(socket, io) {
  return (data) => {
    const player = players.get(socket.id);
    if (!player || !ALLOWED_REACTIONS.has(data.emoji)) return;
    io.emit("player:reacted", { id: socket.id, name: player.name, emoji: data.emoji });
  };
}

function onConvStart(socket, io) {
  return ({ withId }) => {
    if (isInConversation(socket.id) || isInConversation(withId)) return;
    const convId = createConversation([socket.id, withId], (id) => broadcastConvUpdate(id, io, players));
    console.log(`Conversation ${convId} started`);
  };
}

function onConvRequest(socket, io) {
  return ({ convId }) => {
    const conv = getConversation(convId);
    const requester = players.get(socket.id);
    if (!conv || !requester) return;
    conv.members.forEach((mid) =>
      io.to(mid).emit("conv:join-request", { convId, requesterId: socket.id, requesterName: requester.name })
    );
  };
}

function onConvApprove(socket, io) {
  return ({ convId, requesterId }) => {
    const conv = getConversation(convId);
    if (!conv || !conv.members.has(socket.id)) return; 
    if (isInConversation(requesterId)) removeFromConversation(requesterId, io, players);
    addToConversation(convId, requesterId, (id) => broadcastConvUpdate(id, io, players));
    io.to(requesterId).emit("conv:approved", { convId, members: Array.from(conv.members) });
    conv.members.forEach((mid) => { 
      if (mid !== requesterId) {
        io.to(mid).emit("conv:member-added", { convId, newMemberId: requesterId });
        io.to(requesterId).emit("conv:connect-to", { peerId: mid });
      }
    });
  };
}

function onConvDeny(socket, io) {
  return ({ convId, requesterId }) => io.to(requesterId).emit("conv:denied", { convId });
}

function onConvLeave(socket, io) {
  return () => removeFromConversation(socket.id, io, players);
}

function onFurniturePlace(socket, io, map) {
  return (data) => {
    const { x, y } = data;
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return;
    const item = placeFurniture({ ...data, placedBy: socket.id }, map, players);
    if (!item) return;
    io.emit("furniture:placed", item);
    console.log(`${players.get(socket.id)?.name} placed type ${item.type} at (${x},${y})`);
  };
}

function onFurnitureRemove(socket, io) {
  return ({ furnitureId }) => {
    const item = removeFurniture(furnitureId);
    if (!item) return;
    io.emit("furniture:removed", { furnitureId, x: item.x, y: item.y });
  };
}

function onDisconnect(socket, io) {
  return () => {
    const player = players.get(socket.id);
    if (player) console.log(`${player.name} disconnected`);
    removeFromConversation(socket.id, io, players);
    players.delete(socket.id);
    io.emit("player:left", { id: socket.id });
  };
}