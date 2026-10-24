import { spawn } from "child_process";
import { io } from "./Gather/client/node_modules/socket.io-client/build/esm/index.js";

console.log("=== [TEST 1] Starting Gather Server on port 3001 ===");
const serverProc = spawn(process.execPath, ["server.js"], {
  cwd: "d:/game/research-stage0/Gather/server",
  stdio: ["ignore", "pipe", "pipe"],
});

serverProc.stdout.on("data", (d) => process.stdout.write(`[SERVER] ${d}`));
serverProc.stderr.on("data", (d) => process.stderr.write(`[SERVER ERR] ${d}`));

await new Promise((r) => setTimeout(r, 1500));

// Health check
const healthRes = await fetch("http://localhost:3001/health").then((r) => r.json());
console.log("[HEALTH CHECK]", healthRes);

console.log("=== [TEST 2] Connecting 2 Online Players (Player A & Player B) ===");
const clientA = io("http://localhost:3001", { transports: ["websocket"] });
const clientB = io("http://localhost:3001", { transports: ["websocket"] });

let initA = null;
let initB = null;
let aSawBJoin = false;
let bSawAMove = false;
let bSawAFurniture = false;
let bSawAReaction = false;

clientA.on("game:init", (data) => {
  initA = data;
  console.log(`[Client A] game:init received: id=${data.playerId}, map=${data.mapCols}x${data.mapRows}, spawn=(${data.players[data.playerId].x},${data.players[data.playerId].y})`);
});

clientA.on("player:joined", (p) => {
  console.log(`[Client A] saw player:joined -> ${p.name} (${p.id}) at (${p.x},${p.y})`);
  if (p.name === "PlayerB_Mobile") aSawBJoin = true;
});

clientB.on("game:init", (data) => {
  initB = data;
  console.log(`[Client B] game:init received: id=${data.playerId}, totalPlayers=${Object.keys(data.players).length}`);
});

clientB.on("player:moved", (d) => {
  console.log(`[Client B] saw player:moved -> id=${d.id}, pos=(${d.x},${d.y}), dir=${d.direction}`);
  if (d.id === initA?.playerId) bSawAMove = true;
});

clientB.on("furniture:placed", (item) => {
  console.log(`[Client B] saw furniture:placed -> id=${item.id}, type=${item.type} at (${item.x},${item.y})`);
  bSawAFurniture = true;
});

clientB.on("player:reacted", (r) => {
  console.log(`[Client B] saw player:reacted -> ${r.name} reacted ${r.emoji}`);
  if (r.emoji === "👋") bSawAReaction = true;
});

await new Promise((resolve) => {
  clientA.on("connect", () => {
    clientA.emit("player:join", { name: "PlayerA_Desktop" });
    setTimeout(() => {
      clientB.emit("player:join", { name: "PlayerB_Mobile" });
      setTimeout(resolve, 500);
    }, 300);
  });
});

// Test movement of Player A in all 4 directions to find a walkable adjacent tile
const dirs = [
  { dx: 0, dy: 1, direction: "down" },
  { dx: 0, dy: -1, direction: "up" },
  { dx: 1, dy: 0, direction: "right" },
  { dx: -1, dy: 0, direction: "left" },
];
for (const move of dirs) {
  clientA.emit("player:move", move);
  await new Promise((r) => setTimeout(r, 150));
}

// Test reaction
clientA.emit("player:reaction", { emoji: "👋" });
await new Promise((r) => setTimeout(r, 200));

// Test furniture placement on a known walkable floor tile (e.g., 5, 7)
clientA.emit("furniture:place", { type: 5, x: 5, y: 7 });
await new Promise((r) => setTimeout(r, 300));

// Test conversation creation when two players are near
clientA.emit("conv:start", { withId: initB.playerId });
await new Promise((r) => setTimeout(r, 300));

console.log("=== [TEST SUMMARY] ===");
console.log({
  serverHealth: healthRes.status === "ok",
  initAReceived: !!initA,
  initBReceived: !!initB,
  aSawBJoin,
  bSawAMove,
  bSawAReaction,
  bSawAFurniture,
});

clientA.disconnect();
clientB.disconnect();
serverProc.kill();
process.exit(0);
