import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Load .env from backend folder (same dir as server.ts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { sanitizeBody, sanitizeQuery } from "./middleware/security.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/logging.js";
import { logger } from "./utils/logger.js";

// Import existing routes and models
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chatRoutes.js";
import worldRoutes from "./routes/worldRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import { registerChatHandlers } from "./controllers/chatController.js";
import Room from "./models/Room.js";
import RoomMember from "./models/RoomMember.js";
import User from "./models/User.js";
import { registerSFUHandlers } from "./webrtc/sfu.js";

// Tải biến môi trường (Loaded at top)

const app = express();
const httpServer = createServer(app); // Sử dụng httpServer cho Socket.IO
const PORT = process.env.PORT || 5001; // Default to 5001 as per previous fix

const parseCsv = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const allowedOrigins = new Set<string>([
  "http://localhost:3000",
  "http://localhost:5173",
  ...parseCsv(process.env.CLIENT_URL),
  ...parseCsv(process.env.CLIENT_URLS),
]);

const netlifySiteName = (process.env.NETLIFY_SITE_NAME || "").trim().toLowerCase();
const allowNetlifyPreviews = process.env.ALLOW_NETLIFY_PREVIEWS === "true" && !!netlifySiteName;
const netlifyPreviewRegex = allowNetlifyPreviews
  ? new RegExp(`^[a-z0-9-]+--${escapeRegex(netlifySiteName)}\\.netlify\\.app$`)
  : null;

const isAllowedOrigin = (origin?: string) => {
  // Allow same-origin/curl/server-to-server requests where Origin header is absent.
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const url = new URL(origin);
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    ) {
      return true;
    }

    if (
      allowNetlifyPreviews &&
      url.protocol === "https:" &&
      netlifyPreviewRegex &&
      netlifyPreviewRegex.test(url.hostname)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

// Middleware CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

// DEBUG: Log all requests (only when LOG_LEVEL=debug)
app.use((req, res, next) => {
  if ((process.env.LOG_LEVEL || "").toLowerCase() === "debug") {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl || req.url}`);
  }
  // Fix Cross-Origin-Opener-Policy warnings for Google OAuth popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Add request logger
app.use(requestLogger);

// Apply input sanitization middleware globally
app.use(sanitizeBody);
app.use(sanitizeQuery);

// Health check endpoint (before rate limiting)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Apply rate limiting to all API routes
app.use("/api", apiRateLimiter);

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Socket CORS blocked for origin: ${origin}`), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Voice rule: track which voice channel a user is currently in (per room)
// Key: `${roomId}:${userId}` -> channelId
const userActiveVoiceChannel = new Map<string, string>();

// Online status rule: debounce offline by 5s to avoid flicker on quick reconnect
// Key: `${roomId}:${userId}` -> timeout
const pendingOfflineTimers = new Map<string, NodeJS.Timeout>();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town")
  .then(() => logger.info("MongoDB connected successfully"))
  .catch((err) => logger.error("MongoDB connection error", err));

// ----------------------------------------------------------------
// PHẦN LOGIC AUTH (Google + OTP)
// ----------------------------------------------------------------
// Note: Authentication logic (Register, Login, OTP, Google OAuth)
// is handled in routes/auth.ts which is mounted at /api/auth below.


// ----------------------------------------------------------------
// EXISTING ROUTES & GAME LOGIC
// ----------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/world", worldRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes); // Alias for frontend compatibility

app.use("/api/spaces", spaceRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Room users endpoint
app.get("/api/rooms/:roomId/users", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // Get all room members from database (including offline)
    const allMembers = await RoomMember.find({ roomId }).lean();

    // Get online users from connectedUsers
    const onlineUserIds = new Set(
      Array.from(connectedUsers.values())
        .filter((u) => u.roomId === roomId)
        .map((u) => u.userId)
    );

    // Combine database members with online status
    const users = allMembers.map((member: any) => {
      const connectedUser = Array.from(connectedUsers.values()).find(
        (u) => u.userId === member.userId && u.roomId === roomId
      );

      return {
        userId: member.userId,
        username: member.username,
        avatar: member.avatar,
        position: connectedUser?.position || { x: 0, y: 0 },
        status: onlineUserIds.has(member.userId) ? "online" : "offline",
        lastSeen: member.lastSeen,
        role: member.role || "member",
      };
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching room users:", error);
    res.status(500).json({ message: "Failed to fetch room users" });
  }
});

// Room invite endpoint (alias for /api/spaces/:roomId/invite)
app.post("/api/rooms/:roomId/invite", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"
      }/lobby?room=${roomId}`;

    res.json({
      inviteLink,
      roomId: room.roomId,
      roomName: room.name,
      maxUsers: room.maxUsers,
    });
  } catch (error) {
    console.error("Error generating invite link:", error);
    res.status(500).json({ message: "Failed to generate invite link" });
  }
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Error handling middleware is already imported and used above

// Socket.IO Connection Handling
interface ConnectedUser {
  userId: string;
  username: string;
  roomId: string;
  avatar?: string;
  position: { x: number; y: number };
  direction?: string;
  socketId: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: string[];
  roomId: string;
  createdBy: string;
  createdAt: number;
}

const connectedUsers = new Map<string, ConnectedUser>(); // socketId -> userData
const roomUsers = new Map<string, Set<string>>(); // roomId -> Set of socketIds
const groupChats = new Map<string, GroupChat>(); // groupId -> { id, name, members, roomId, createdBy }
const voiceChannels = new Map<string, Set<string>>(); // channelId -> Set of userIds (GLOBAL, shared across all connections)
const batchUpdateIntervals = new Map<string, NodeJS.Timeout>(); // roomId -> interval for batch position updates

// Socket event rate limiting (in-memory)
type SocketRateKey = string;
const socketRateStore = new Map<SocketRateKey, { count: number; resetTime: number }>();
const socketRateHit = (key: SocketRateKey, windowMs: number, max: number) => {
  const t = Date.now();
  const cur = socketRateStore.get(key);
  if (!cur || cur.resetTime <= t) {
    socketRateStore.set(key, { count: 1, resetTime: t + windowMs });
    return { limited: false, retryAfterSec: 0 };
  }
  if (cur.count >= max) {
    return { limited: true, retryAfterSec: Math.ceil((cur.resetTime - t) / 1000) };
  }
  cur.count += 1;
  socketRateStore.set(key, cur);
  return { limited: false, retryAfterSec: 0 };
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with user data
  socket.on("user-join", async (data) => {
    try {
      const { userId, username, roomId, avatar, position, avatarConfig } = data;
      const startPosition =
        position &&
          typeof position.x === "number" &&
          typeof position.y === "number"
          ? position
          : { x: 100, y: 100 };

      // Validate username
      if (!username || username.trim() === "") {
        socket.emit("app-error", { message: "Tên người dùng không được để trống" });
        return;
      }

      // Get or create room
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({
          roomId,
          name: `Room ${roomId}`,
          maxUsers: Number(process.env.DEFAULT_ROOM_CAPACITY) || 20,
          isActive: true,
        });
        await room.save();
      }
      
      // Block joining disabled rooms
      if ((room as any).isActive === false) {
        socket.emit("app-error", {
          message: "Phòng hiện đang bị tạm khóa bởi quản trị viên.",
        });
        return;
      }

      // Check for duplicate username in room
      const existingUsersInRoom = Array.from(roomUsers.get(roomId) || [])
        .map((id) => connectedUsers.get(id))
        .filter(Boolean);

      const duplicateUser = existingUsersInRoom.find(
        (u) =>
          u && u.username.toLowerCase().trim() === username.toLowerCase().trim()
      );

      if (duplicateUser) {
        socket.emit("app-error", {
          message: `Tên "${username}" đã được sử dụng trong phòng này. Vui lòng chọn tên khác.`,
        });
        return;
      }

      // Check room capacity
      const currentUserCount = roomUsers.get(roomId)?.size || 0;
      if (currentUserCount >= room.maxUsers) {
        socket.emit("room-full", {
          message: `Phòng đã đầy (${room.maxUsers}/${room.maxUsers} người)`,
          maxUsers: room.maxUsers,
          currentUsers: currentUserCount,
        });
        return;
      }

      // Store user connection (avatarConfig for in-game custom sprites)
      connectedUsers.set(socket.id, {
        userId,
        username: username.trim(),
        roomId,
        avatar,
        avatarConfig: avatarConfig || undefined,
        position: startPosition, // Use client-provided or default position
        socketId: socket.id,
      });

      // Cancel pending offline if user reconnects quickly (avoid flicker)
      const offlineKey = `${roomId}:${userId}`;
      const pending = pendingOfflineTimers.get(offlineKey);
      if (pending) {
        clearTimeout(pending);
        pendingOfflineTimers.delete(offlineKey);
        console.log(`✅ Cancelled pending offline for ${offlineKey}`);
      }

      // Add to room FIRST
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);
      socket.join(roomId);

      // Save/Update RoomMember in database FIRST (mark as online)
      // Use upsert with proper error handling to prevent race conditions
      let roleToSet: "admin" | "member" = "member";
      try {
        // Ensure there is at least one admin in the room, but NEVER downgrade an existing admin.
        const existingMember: any = await RoomMember.findOne({ roomId, userId })
          .select({ role: 1 })
          .lean();
        const roomHasAdmin = await RoomMember.exists({ roomId, role: "admin" });
        roleToSet = !roomHasAdmin ? "admin" : (existingMember?.role || "member");

        await RoomMember.findOneAndUpdate(
          { roomId, userId },
          {
            roomId,
            userId,
            username: username.trim(),
            avatar: avatar || username.trim().charAt(0).toUpperCase(),
            isOnline: true,
            lastSeen: new Date(),
            role: roleToSet,
            $setOnInsert: { joinedAt: new Date() },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            // Use runValidators to ensure data integrity
            runValidators: true
          }
        );
        console.log(`Updated RoomMember ${userId} to online in room ${roomId}`);
      } catch (error: any) {
        // Handle duplicate key errors (race condition)
        if (error.code === 11000) {
          // Duplicate key - try to update existing record
          console.log(`Duplicate key detected for ${userId} in room ${roomId}, updating existing record...`);
          try {
            await RoomMember.findOneAndUpdate(
              { roomId, userId },
              {
                username: username.trim(),
                avatar: avatar || username.trim().charAt(0).toUpperCase(),
                isOnline: true,
                lastSeen: new Date(),
              },
              { new: true }
            );
            console.log(`Updated existing RoomMember ${userId} to online in room ${roomId}`);
          } catch (updateError) {
            console.error("Error updating existing RoomMember:", updateError);
          }
        } else {
          console.error("Error saving RoomMember:", error);
        }
      }

      // Load ALL room members from database AFTER updating
      let allRoomMembers: Array<{
        userId: string;
        username: string;
        avatar: string;
        roomId: string;
        isOnline: boolean;
        lastSeen: Date;
        [key: string]: unknown;
      }> = [];
      try {
        allRoomMembers = await RoomMember.find({ roomId }).lean();

        // Calculate online status AFTER user has been added to roomUsers
        const onlineUserIds = new Set(
          Array.from(roomUsers.get(roomId) || [])
            .map((id) => connectedUsers.get(id)?.userId)
            .filter(Boolean)
        );

        console.log(`Room ${roomId} online users:`, Array.from(onlineUserIds));

        // Update isOnline status based on actual connections
        allRoomMembers = allRoomMembers.map((member) => ({
          ...member,
          isOnline: onlineUserIds.has(member.userId),
        }));
      } catch (error) {
        console.error("Error loading RoomMembers:", error);
      }

      // Prepare ALL room members list (online + offline) with correct status
      // Use Map to deduplicate by userId (in case of database duplicates)
      const usersMap = new Map();
      allRoomMembers.forEach((member: any) => {
        // Get position from connected users if online
        const connectedUser = Array.from(connectedUsers.values()).find(
          (u) => u.userId === member.userId && u.roomId === roomId
        );

        const userStatus = member.isOnline ? "online" : "offline";

        // Deduplicate: if same userId exists, keep the latest one
        usersMap.set(member.userId, {
          userId: member.userId,
          username: member.username,
          avatar: member.avatar,
          avatarConfig: (connectedUser as any)?.avatarConfig,
          position: connectedUser?.position || { x: 0, y: 0 },
          direction: connectedUser?.direction,
          status: userStatus,
          role: member.role || "member",
        });
      });

      // Normalize admin: if multiple admins exist due to race, keep a deterministic winner.
      try {
        const admins = (allRoomMembers as any[]).filter((m) => (m as any).role === "admin");
        if (admins.length > 1) {
          const winner = admins
            .slice()
            .sort((a, b) => {
              const aj = new Date((a as any).joinedAt || 0).getTime();
              const bj = new Date((b as any).joinedAt || 0).getTime();
              if (aj !== bj) return aj - bj;
              return String((a as any).userId).localeCompare(String((b as any).userId));
            })[0];

          const winnerId = (winner as any).userId;
          await RoomMember.updateMany(
            { roomId, role: "admin", userId: { $ne: winnerId } },
            { $set: { role: "member" } }
          );

          io.to(roomId).emit("room-admin-changed", {
            roomId,
            newAdminUserId: winnerId,
          });
          console.warn(`⚠️ Normalized multiple admins in room ${roomId}. Winner=${winnerId}`);

          // refresh members after normalization so role payload is correct
          allRoomMembers = await RoomMember.find({ roomId }).lean();

          const onlineUserIds = new Set(
            Array.from(roomUsers.get(roomId) || [])
              .map((id) => connectedUsers.get(id)?.userId)
              .filter(Boolean)
          );

          allRoomMembers = (allRoomMembers as any[]).map((member) => ({
            ...member,
            isOnline: onlineUserIds.has((member as any).userId),
          })) as any;

          // rebuild usersMap with corrected roles
          usersMap.clear();
          (allRoomMembers as any[]).forEach((member: any) => {
            const connectedUser = Array.from(connectedUsers.values()).find(
              (u) => u.userId === member.userId && u.roomId === roomId
            );
            const userStatus = member.isOnline ? "online" : "offline";
            usersMap.set(member.userId, {
              userId: member.userId,
              username: member.username,
              avatar: member.avatar,
              avatarConfig: (connectedUser as any)?.avatarConfig,
              position: connectedUser?.position || { x: 0, y: 0 },
              direction: connectedUser?.direction,
              status: userStatus,
              role: member.role || "member",
            });
          });
        }
      } catch (e) {
        console.error("Error normalizing room admins:", e);
      }

      const allUsersInRoom = Array.from(usersMap.values());

      // Log duplicates if any
      if (allRoomMembers.length !== usersMap.size) {
        console.warn(`⚠️ Found ${allRoomMembers.length - usersMap.size} duplicate RoomMembers in database for room ${roomId}`);
      }

      console.log(`Broadcasting user-joined for ${username} (${userId}) to room ${roomId}`);

      // Notify others in room - IMMEDIATELY broadcast user-joined (avatarConfig for correct in-game sprite)
      io.to(roomId).emit("user-joined", {
        userId,
        username: username.trim(),
        avatar,
        avatarConfig: avatarConfig || undefined,
        position: startPosition,
        status: "online", // Explicitly set status
        role: roleToSet,
      });

      // Broadcast updated room-users list to ALL users in room (realtime update)
      // This ensures all users see the updated status immediately
      // Broadcast full room-users INCLUDING current user so clients can render consistent role/status
      const usersToBroadcast = allUsersInRoom;
      console.log(`📢 Broadcasting room-users to ALL users in room ${roomId}:`, usersToBroadcast.length, "users (incl self)");
      console.log("📢 Users to broadcast:", usersToBroadcast.map(u => ({ userId: u.userId, username: u.username, status: u.status, role: (u as any).role })));

      // IMPORTANT: Broadcast to ALL users in room using io.to() - this ensures realtime update for everyone
      // This includes the new user's other tabs and all other users in the room
      io.to(roomId).emit("room-users", usersToBroadcast);
      console.log(`✅ Broadcasted room-users event to room ${roomId}`);

      // Send all players positions including the new user (avatarConfig for correct in-game sprite)
      const allPlayersInRoom = Array.from(roomUsers.get(roomId))
        .map((id) => {
          const u = connectedUsers.get(id);
          if (u) {
            return {
              userId: u.userId,
              username: u.username,
              avatar: u.avatar,
              avatarConfig: (u as any).avatarConfig,
              position: u.position,
              direction: u.direction,
            };
          }
          return null;
        })
        .filter(Boolean);

      socket.emit("allPlayersPositions", allPlayersInRoom);

      // Emit room info with user count
      const finalUserCount = roomUsers.get(roomId)?.size || 0;
      io.to(roomId).emit("room-info", {
        roomId,
        currentUsers: finalUserCount,
        maxUsers: room.maxUsers,
      });

      console.log(
        `${username.trim()} joined room ${roomId} (${finalUserCount}/${room.maxUsers
        })`
      );

      // Start batch position update interval for this room if not already started
      startBatchUpdateForRoom(roomId);
    } catch (error) {
      console.error("Error in user-join:", error);
      socket.emit("app-error", { message: "Failed to join room" });
    }
  });

  // Handle avatar movement
  socket.on("playerMovement", (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.position = data.position || { x: data.x, y: data.y };
      user.direction = data.direction;

      // Emit individual player movement to others in room (real-time)
      socket.to(user.roomId).emit("playerMoved", {
        userId: user.userId,
        username: user.username,
        position: user.position,
        direction: user.direction,
      });

      // Batch update is now sent via interval (see below) to reduce network traffic
    }
  });

  // Batch position updates - send all players positions periodically (every 500ms)
  // This reduces network traffic while still keeping positions synchronized
  // Start batch update interval for room if not already started
  const startBatchUpdateForRoom = (roomId: string) => {
    if (!batchUpdateIntervals.has(roomId)) {
      const interval = setInterval(() => {
        if (!roomUsers.has(roomId) || roomUsers.get(roomId)?.size === 0) {
          clearInterval(interval);
          batchUpdateIntervals.delete(roomId);
          return;
        }

        const allPlayersInRoom = Array.from(roomUsers.get(roomId) || [])
          .map((id) => {
            const u = connectedUsers.get(id);
            if (u) {
              return {
                userId: u.userId,
                username: u.username,
                avatar: u.avatar,
                avatarConfig: (u as any).avatarConfig,
                position: u.position,
                direction: u.direction,
              };
            }
            return null;
          })
          .filter(Boolean);

        // Broadcast to all users in room
        if (allPlayersInRoom.length > 0) {
          io.to(roomId).emit("allPlayersPositions", allPlayersInRoom);
        }
      }, 500); // Every 500ms

      batchUpdateIntervals.set(roomId, interval);
    }
  };

  // Handle reactions
  socket.on("reaction", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    io.to(user.roomId).emit("reaction", {
      userId: user.userId,
      reaction: data.reaction,
      timestamp: data.timestamp || Date.now(),
    });
  });

  registerChatHandlers({ io, socket, connectedUsers, roomUsers, groupChats });
  // SFU (mediasoup) handlers for scalable voice/video (20+ users)
  registerSFUHandlers(io, socket);

  // Whiteboard handlers
  socket.on("whiteboard-draw", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    socket.to(user.roomId).emit("whiteboard-draw", {
      ...data,
      userId: user.userId,
      username: user.username,
    });
  });

  // WebRTC Signaling
  socket.on("webrtc-offer", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { targetUserId, offer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-offer", {
        fromUserId: user.userId,
        offer,
      });
    } else {
      console.warn(`Target user ${targetUserId} not found for WebRTC offer`);
    }
  });

  socket.on("webrtc-answer", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { targetUserId, answer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-answer", {
        fromUserId: user.userId,
        answer,
      });
    } else {
      console.warn(`Target user ${targetUserId} not found for WebRTC answer`);
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { targetUserId, candidate } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-ice-candidate", {
        fromUserId: user.userId,
        candidate,
      });
    } else {
      console.warn(
        `Target user ${targetUserId} not found for WebRTC ICE candidate`
      );
    }
  });

  // Voice Channel Management (using global voiceChannels Map defined above)
  socket.on("join-voice-channel", (data: { channelId: string; userId: string; roomId: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      console.warn("join-voice-channel: User not found in connectedUsers");
      return;
    }

    const { channelId, userId, roomId } = data;
    // Rate limit: prevent join/leave spam (per user)
    const rl = socketRateHit(`join-voice:${roomId}:${userId}`, 10_000, 20);
    if (rl.limited) {
      socket.emit("app-error", {
        message: `Bạn thao tác voice quá nhanh. Thử lại sau ${rl.retryAfterSec}s`,
      });
      return;
    }

    // Verify user is in the same room
    if (user.roomId !== roomId) {
      console.warn(`User ${userId} tried to join voice channel in different room. User room: ${user.roomId}, Requested room: ${roomId}`);
      return;
    }

    // Initialize channel if it doesn't exist
    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Set());
      console.log(`Created new voice channel: ${channelId}`);
    }

    // Rule: 1 user chỉ được join 1 voice channel
    const userKey = `${roomId}:${userId}`;
    const prevChannelId = userActiveVoiceChannel.get(userKey);
    if (prevChannelId && prevChannelId !== channelId) {
      const prevSet = voiceChannels.get(prevChannelId);
      if (prevSet && prevSet.has(userId)) {
        prevSet.delete(userId);
        if (prevSet.size === 0) {
          voiceChannels.delete(prevChannelId);
        }
        io.to(roomId).emit("voice-channel-update", {
          channelId: prevChannelId,
          users: Array.from(prevSet || []),
        });
        console.log(`Auto-left previous voice channel ${prevChannelId} for user ${userId}`);
      }
    }

    // Rule: Voice channel tối đa 20 người
    const currentUsers = voiceChannels.get(channelId) || new Set<string>();
    if (!currentUsers.has(userId) && currentUsers.size >= 20) {
      socket.emit("voice-channel-full", {
        channelId,
        message: "Voice channel đã đầy (20 người)",
        maxUsers: 20,
      });
      console.warn(`Voice channel full: ${channelId} (size=${currentUsers.size})`);
      return;
    }

    // Add user to channel
    voiceChannels.get(channelId)?.add(userId);
    userActiveVoiceChannel.set(userKey, channelId);

    // Get all users in this voice channel
    const channelUsers = Array.from(voiceChannels.get(channelId) || []);

    console.log(`User ${user.username} (${userId}) joined voice channel ${channelId}. Total users: ${channelUsers.length}`, channelUsers);

    // Get all sockets in the room
    const roomSockets = Array.from(roomUsers.get(roomId) || []);
    console.log(`Broadcasting to ${roomSockets.length} sockets in room ${roomId}`);

    // Broadcast to all users in the room (including the user who just joined)
    const updateData = {
      channelId,
      users: channelUsers,
    };

    console.log(`✅ Broadcasting voice-channel-update for channel ${channelId} to room ${roomId} with ${channelUsers.length} users:`, channelUsers);
    console.log(`✅ Room ${roomId} has ${roomSockets.length} sockets:`, roomSockets);

    // Broadcast to all sockets in the room
    io.to(roomId).emit("voice-channel-update", updateData);

    // Also send directly to the socket to ensure it receives the update immediately
    socket.emit("voice-channel-update", updateData);
    console.log(`✅ Also sent voice-channel-update directly to socket ${socket.id}`);
  });

  socket.on("leave-voice-channel", (data: { channelId: string; userId: string; roomId: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { channelId, userId, roomId } = data;
    // Rate limit: prevent spam
    const rl = socketRateHit(`leave-voice:${roomId}:${userId}`, 10_000, 20);
    if (rl.limited) {
      socket.emit("app-error", {
        message: `Bạn thao tác voice quá nhanh. Thử lại sau ${rl.retryAfterSec}s`,
      });
      return;
    }

    // Remove user from channel
    const channel = voiceChannels.get(channelId);
    if (channel) {
      channel.delete(userId);

      // If channel is empty, remove it
      if (channel.size === 0) {
        voiceChannels.delete(channelId);
      }

      // Get updated users list
      const channelUsers = Array.from(channel);

      console.log(`User ${user.username} (${userId}) left voice channel ${channelId}. Remaining users: ${channelUsers.length}`, channelUsers);

      // Broadcast to all users in the room
      io.to(roomId).emit("voice-channel-update", {
        channelId,
        users: channelUsers,
      });

      console.log(`Broadcasted voice-channel-update for channel ${channelId} to room ${roomId} with ${channelUsers.length} users`);
    }

    // Clear active voice mapping if it matches
    const userKey = `${roomId}:${userId}`;
    if (userActiveVoiceChannel.get(userKey) === channelId) {
      userActiveVoiceChannel.delete(userKey);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User ${user.username} (${user.userId}) is disconnecting`);

      // Store user info before removing
      const userId = user.userId;
      const roomId = user.roomId;
      const username = user.username;

      // Remove from roomUsers first
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
      }

      // Remove from connectedUsers
      connectedUsers.delete(socket.id);

      // Check if user still has other connections in this room
      const remainingInRoom = Array.from(roomUsers.get(roomId) || [])
        .map((id) => connectedUsers.get(id))
        .filter((u) => u && u.userId === userId);

      const hasOtherConnections = remainingInRoom.length > 0;

      // Remove user from all voice channels
      voiceChannels.forEach((channelUsers, channelId) => {
        if (channelUsers.has(userId)) {
          channelUsers.delete(userId);
          if (channelUsers.size === 0) {
            voiceChannels.delete(channelId);
          }
          // Broadcast updated voice channel
          io.to(roomId).emit("voice-channel-update", {
            channelId,
            users: Array.from(channelUsers),
          });
          console.log(`Removed user ${userId} from voice channel ${channelId} on disconnect`);
        }
      });

      // Clear active voice mapping
      userActiveVoiceChannel.delete(`${roomId}:${userId}`);

      // Update RoomMember to offline in database ONLY if no other connections.
      // Debounce by 5s to avoid status flicker from quick reconnect.
      if (!hasOtherConnections) {
        const offlineKey = `${roomId}:${userId}`;

        // Clear existing timer if any
        const existingTimer = pendingOfflineTimers.get(offlineKey);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(async () => {
          pendingOfflineTimers.delete(offlineKey);

          // If user reconnected within 5s, skip marking offline
          const reconnected = Array.from(roomUsers.get(roomId) || [])
            .map((id) => connectedUsers.get(id))
            .some((u) => u && u.userId === userId && u.roomId === roomId);

          if (reconnected) {
            console.log(`⏭️ Skip offline for ${offlineKey} (reconnected within 5s)`);
            return;
          }

          // Broadcast user-left AFTER debounce
          io.to(roomId).emit("user-left", {
            userId,
            username,
            timestamp: Date.now(),
          });
          console.log(`Broadcasted user-left (debounced) for ${username} to room ${roomId}`);

          try {
            console.log(`Marking user ${userId} as offline in database (debounced)`);
            await RoomMember.findOneAndUpdate(
              { roomId, userId },
              { isOnline: false, lastSeen: new Date() },
              { new: false, runValidators: true }
            );

            // If this user is the only admin, ensure there is at least one (prefer online member)
            try {
              const adminsLeft = await RoomMember.exists({
                roomId,
                role: "admin",
                userId: { $ne: userId },
              });

              if (!adminsLeft) {
                const candidate = await RoomMember.findOne({
                  roomId,
                  userId: { $ne: userId },
                })
                  .sort({ isOnline: -1, joinedAt: 1 })
                  .lean();

                if (candidate) {
                  await RoomMember.findOneAndUpdate(
                    { roomId, userId: (candidate as any).userId },
                    { role: "admin" }
                  );
                  io.to(roomId).emit("room-admin-changed", {
                    roomId,
                    newAdminUserId: (candidate as any).userId,
                  });
                  console.log(`✅ Promoted new room admin: ${(candidate as any).userId} in room ${roomId}`);
                }
              }
            } catch (e) {
              console.error("Error ensuring room admin:", e);
            }

            // Broadcast updated room-users list to all users in room (with correct status)
            try {
              const allRoomMembers = await RoomMember.find({ roomId }).lean();
              const onlineUserIds = new Set(
                Array.from(roomUsers.get(roomId) || [])
                  .map((id) => connectedUsers.get(id)?.userId)
                  .filter((id): id is string => id !== undefined)
              );

              const membersMap = new Map<string, any>();
              allRoomMembers.forEach((member: any) => {
                const connectedUser = Array.from(connectedUsers.values()).find(
                  (u) => u.userId === member.userId && u.roomId === roomId
                );

                membersMap.set(member.userId, {
                  userId: member.userId,
                  username: member.username,
                  avatar: member.avatar,
                  position: connectedUser?.position || { x: 0, y: 0 },
                  direction: connectedUser?.direction,
                  status: onlineUserIds.has(member.userId) ? "online" : "offline",
                  role: member.role || "member",
                });
              });

              const updatedMembers = Array.from(membersMap.values());
              if (allRoomMembers.length !== membersMap.size) {
                console.warn(`⚠️ Found ${allRoomMembers.length - membersMap.size} duplicate RoomMembers in database for room ${roomId}`);
              }

              io.to(roomId).emit("room-users", updatedMembers);
              console.log(`Broadcasted updated room-users (debounced) to room ${roomId} (${updatedMembers.length} members)`);
            } catch (error) {
              console.error("Error broadcasting updated room members:", error);
            }
          } catch (error) {
            console.error("Error updating RoomMember on disconnect:", error);
          }
        }, 5000);

        pendingOfflineTimers.set(offlineKey, timer);
      } else {
        console.log(`User ${userId} still has ${remainingInRoom.length} other connections, not marking offline`);
      }

      const finalUserCount = roomUsers.get(user.roomId)?.size || 0;
      if (roomUsers.has(user.roomId)) {
        try {
          const room = await Room.findOne({ roomId: user.roomId });
          if (room) {
            io.to(user.roomId).emit("room-info", {
              roomId: user.roomId,
              currentUsers: finalUserCount,
              maxUsers: room.maxUsers,
            });
          }
        } catch (error) {
          console.error("Error updating room info on disconnect:", error);
        }
      }

      // Note: connectedUsers.delete was already called above, so this is redundant
      // But keeping for safety - check if it exists first
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
      }

      // Cleanup batch update interval if room is empty
      if (roomUsers.has(roomId) && roomUsers.get(roomId)?.size === 0) {
        const interval = batchUpdateIntervals.get(roomId);
        if (interval) {
          clearInterval(interval);
          batchUpdateIntervals.delete(roomId);
          console.log(`Cleaned up batch update interval for room ${roomId}`);
        }
      }

      console.log(`${user.username} (${user.userId}) disconnected and removed from connectedUsers`);
    } else {
      console.log(`Socket ${socket.id} disconnected but was not in connectedUsers`);
    }
  });
});

httpServer.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});
