import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { generateOfficeMap } from "./game/map.js";
import { registerHandlers } from "./socket/handlers.js";

const app = express();
app.use(cors());

const server = createServer(app); 
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
 
const map = generateOfficeMap();
registerHandlers(io, map);

app.get("/",        (req, res) => res.json({ status: "running", players: io.engine.clientsCount }));
app.get("/health",  (req, res) => res.json({ status: "ok" }));
app.get("/favicon.ico", (req, res) => res.status(204).end());

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));