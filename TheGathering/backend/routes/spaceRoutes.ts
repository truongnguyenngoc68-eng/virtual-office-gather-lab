/**
 * Space/Room routes
 * Combines event and room management
 */
import express, { Request, Response } from "express";
import Room from "../models/Room.js";
import RoomMember from "../models/RoomMember.js";
import Map from "../models/Map.js";
import ObjectModel from "../models/Object.js";
import Event from "../models/Event.js";
import Message from "../models/Message.js";
import {
  getEventsByRoom,
  createEvent,
  updateEvent,
  rsvpEvent,
  deleteEvent,
  markAttendance,
} from "../controllers/eventController.js";
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/eventTemplateController.js";
import { authenticate, optionalAuthenticate } from "../middleware/security.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// ============================================
// Room Routes
// ============================================

// List rooms
// - Public (no auth): returns public rooms only
// - Auth: can pass ?mine=1 to get rooms created/joined by the user
router.get(
  "/",
  optionalAuthenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const mine = String(req.query.mine || "") === "1";
      const userId = (req as any).userId as string | undefined;

      if (!userId) {
        // Unauthed: only public rooms
        const rooms = await Room.find({ isPrivate: false })
          .sort({ updatedAt: -1 })
          .limit(100)
          .lean();
        res.json({ rooms });
        return;
      }

      if (mine) {
        const memberRoomIds = await RoomMember.find({ userId })
          .select({ roomId: 1, _id: 0 })
          .lean();
        const roomIdSet = new Set(memberRoomIds.map((m: any) => m.roomId));

        // include createdBy rooms even if user is not a member yet
        const createdRooms = await Room.find({ createdBy: userId })
          .select({ roomId: 1 })
          .lean();
        createdRooms.forEach((r: any) => roomIdSet.add(r.roomId));

        const roomIds = Array.from(roomIdSet);
        const rooms = await Room.find({ roomId: { $in: roomIds } })
          .sort({ updatedAt: -1 })
          .lean();

        res.json({ rooms });
        return;
      }

      // Authed + not mine: show public rooms + rooms user created
      const rooms = await Room.find({
        $or: [{ isPrivate: false }, { createdBy: userId }],
      })
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();
      res.json({ rooms });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

// Create room
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const rawRoomId = String(req.body.roomId || "").trim();
    const name = String(req.body.name || "").trim() || "Không gian của tôi";
    const description = String(req.body.description || "").trim();
    const isPrivate = !!req.body.isPrivate;
    const isActive = req.body.isActive === undefined ? true : !!req.body.isActive;
    const maxUsers = Number(req.body.maxUsers || 20);

    const roomId =
      rawRoomId ||
      `space-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const existing = await Room.findOne({ roomId }).lean();
    if (existing) {
      res.status(409).json({ message: "Room ID already exists" });
      return;
    }

    const room = await Room.create({
      roomId,
      name,
      description,
      isPrivate,
      isActive,
      maxUsers,
      createdBy: userId,
    });

    res.status(201).json({ room });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
});

// Admin: toggle room active status
router.patch(
  "/:roomId/status",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const isActive = !!req.body?.isActive;

      const room = await Room.findOneAndUpdate(
        { roomId },
        { $set: { isActive } },
        { new: true }
      ).lean();

      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      res.json({ room });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete room (creator or room admin)
router.delete(
  "/:roomId",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const userId = (req as any).userId as string;

      const room = await Room.findOne({ roomId });
      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      const isCreator = (room as any).createdBy && String((room as any).createdBy) === String(userId);
      const isAdmin = await RoomMember.exists({ roomId, userId, role: "admin" });

      if (!isCreator && !isAdmin) {
        res.status(403).json({ message: "Forbidden: not room owner/admin" });
        return;
      }

      // Cascade delete best-effort
      await Promise.allSettled([
        Room.deleteOne({ roomId }),
        RoomMember.deleteMany({ roomId }),
        Map.deleteMany({ roomId }),
        ObjectModel.deleteMany({ roomId }),
        Event.deleteMany({ roomId }),
        Message.deleteMany({ roomId }),
      ]);

      res.json({ message: "Room deleted" });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

// Get room info
router.get("/:roomId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    res.json(room);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
});

// Generate invite link
router.post(
  "/:roomId/invite",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const room = await Room.findOne({ roomId });

      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      const inviteLink = `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/lobby?room=${roomId}`;

      res.json({
        inviteLink,
        roomId: room.roomId,
        roomName: room.name,
        maxUsers: room.maxUsers,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

// ============================================
// Event Routes
// ============================================

// Get events by room
router.get("/:roomId/events", getEventsByRoom);

// Create event
router.post("/:roomId/events", authenticate, createEvent);

// Update event
router.put("/events/:eventId", authenticate, updateEvent);

// RSVP to event
router.post("/events/:eventId/rsvp", authenticate, rsvpEvent);

// Mark attendance
router.post("/events/:eventId/attendance", authenticate, markAttendance);

// Delete event
router.delete("/events/:eventId", authenticate, deleteEvent);

// Event template routes
router.get("/templates", getTemplates);
router.get("/templates/:templateId", getTemplate);
router.post("/templates", authenticate, createTemplate);
router.put("/templates/:templateId", authenticate, updateTemplate);
router.delete("/templates/:templateId", authenticate, deleteTemplate);

// Legacy routes for backward compatibility
router.get("/room/:roomId/events", getEventsByRoom);

export default router;
