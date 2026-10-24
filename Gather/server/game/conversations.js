const conversations = new Map();
const playerConv = new Map();
let nextId = 1;

export function getConversationsState(players) {
  const result = {};
  conversations.forEach((conv, id) => {
    const memberNames = {};
    conv.members.forEach((mid) => {
      const p = players.get(mid);
      if (p) memberNames[mid] = p.name;
    });
    result[id] = { convId: id, members: Array.from(conv.members), memberNames };
  });
  return result;
}

export function createConversation(memberIds, broadcast) {
  const id = `conv_${nextId++}`;
  conversations.set(id, { id, members: new Set(memberIds) });
  memberIds.forEach((mid) => playerConv.set(mid, id));
  broadcast(id);
  return id;
}

export function addToConversation(convId, playerId, broadcast) {
  const conv = conversations.get(convId);
  if (!conv) return;
  conv.members.add(playerId);
  playerConv.set(playerId, convId);
  broadcast(convId);
}

export function removeFromConversation(playerId, io, players) {
  const convId = playerConv.get(playerId);
  if (!convId) return;
  const conv = conversations.get(convId);
  playerConv.delete(playerId);
  if (!conv) return;
  conv.members.delete(playerId);
  if (conv.members.size <= 1) {
    conv.members.forEach((mid) => {
      playerConv.delete(mid);
      io.to(mid).emit("conv:ended", { convId });
    });
    conversations.delete(convId);
    io.emit("conv:dissolved", { convId });
  } else {
    broadcastConvUpdate(convId, io, players);
  }
}

export function broadcastConvUpdate(convId, io, players) {
  const conv = conversations.get(convId);
  if (!conv) return;
  const memberNames = {};
  conv.members.forEach((mid) => {
    const p = players.get(mid);
    if (p) memberNames[mid] = p.name;
  });
  io.emit("conv:update", { convId, members: Array.from(conv.members), memberNames });
}

export function getConversation(convId) {
  return conversations.get(convId);
}

export function isInConversation(socketId) {
  return playerConv.has(socketId);
}