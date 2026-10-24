import express, { Request, Response } from "express";
import Room from "../models/Room.js";
import RoomMember from "../models/RoomMember.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import { authenticate } from "../middleware/security.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

/**
 * Admin: list all rooms with counts
 */
router.get(
  "/rooms",
  authenticate,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const rooms = await Room.aggregate([
        { $sort: { updatedAt: -1 } },
        { $limit: 500 },
        {
          $lookup: {
            from: "roommembers",
            let: { rid: "$roomId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$roomId", "$$rid"] } } },
              { $count: "count" },
            ],
            as: "memberCounts",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { rid: "$roomId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$roomId", "$$rid"] } } },
              { $count: "count" },
            ],
            as: "messageCounts",
          },
        },
        {
          $project: {
            roomId: 1,
            name: 1,
            description: 1,
            maxUsers: 1,
            isPrivate: 1,
            isActive: 1,
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1,
            member_count: {
              $ifNull: [{ $arrayElemAt: ["$memberCounts.count", 0] }, 0],
            },
            message_count: {
              $ifNull: [{ $arrayElemAt: ["$messageCounts.count", 0] }, 0],
            },
          },
        },
      ]);

      res.json({ rooms });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: get detailed room info (including members)
 */
router.get(
  "/rooms/:roomId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const room = await Room.findOne({ roomId }).lean();
      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      const members = await RoomMember.find({ roomId })
        .select("userId username avatar role lastSeen joinedAt isOnline")
        .sort({ role: -1, joinedAt: 1 })
        .lean();

      res.json({ room, members });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: create room on behalf of system
 */
router.post(
  "/rooms",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId: rawRoomId, name, description, isPrivate, isActive, maxUsers } =
        req.body || {};

      const safeName = String(name || "").trim() || "Admin created room";
      const safeDescription = String(description || "").trim();
      const roomId =
        (rawRoomId && String(rawRoomId).trim()) ||
        `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const exists = await Room.findOne({ roomId }).lean();
      if (exists) {
        res.status(409).json({ message: "Room ID already exists" });
        return;
      }

      const room = await Room.create({
        roomId,
        name: safeName,
        description: safeDescription,
        isPrivate: !!isPrivate,
        isActive: isActive === undefined ? true : !!isActive,
        maxUsers: Number(maxUsers || 20),
        createdBy: null,
      });

      res.status(201).json({ room });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ message: err.message });
    }
  }
);

/**
 * Admin: delete room (force, with cascade)
 */
router.delete(
  "/rooms/:roomId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const room = await Room.findOne({ roomId }).lean();
      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      // best-effort cascade
      await Promise.allSettled([
        Room.deleteOne({ roomId }),
        RoomMember.deleteMany({ roomId }),
        Message.deleteMany({ roomId }),
      ]);

      res.json({ message: "Room deleted by admin" });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: add member to room by userId
 */
router.post(
  "/rooms/:roomId/members",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId } = req.params;
      const { userId, role } = req.body || {};

      if (!userId) {
        res.status(400).json({ message: "userId is required" });
        return;
      }

      const room = await Room.findOne({ roomId }).lean();
      if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const existing = await RoomMember.findOne({ roomId, userId }).lean();
      if (existing) {
        res.status(409).json({ message: "User is already a member of this room" });
        return;
      }

      const member = await RoomMember.create({
        roomId,
        userId,
        username: (user as any).username || (user as any).displayName || "user",
        avatar: (user as any).avatar || "",
        role: role === "admin" ? "admin" : "member",
      });

      res.status(201).json({ member });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ message: err.message });
    }
  }
);

/**
 * Admin: remove member from room
 */
router.delete(
  "/rooms/:roomId/members/:userId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roomId, userId } = req.params;
      const result = await RoomMember.deleteOne({ roomId, userId });

      if (!result.deletedCount) {
        res.status(404).json({ message: "Member not found in room" });
        return;
      }

      res.json({ message: "Member removed from room" });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: list users (basic)
 */
router.get(
  "/users",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit = "50", page = "1" } = req.query;
      const take = Math.min(200, Math.max(1, Number(limit) || 50));
      const skip = (Math.max(1, Number(page) || 1) - 1) * take;

      const query: any = {};
      if (q && String(q).trim().length > 1) {
        const term = String(q).trim();
        query.$or = [
          { username: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select("_id username email role status displayName avatar lastSeen createdAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(take)
          .lean(),
        User.countDocuments(query),
      ]);

      res.json({ users, pagination: { page: Number(page) || 1, limit: take, total } });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: update user (role/status/displayName)
 */
router.patch(
  "/users/:userId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role, status, displayName } = req.body || {};
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      if (role) (user as any).role = role;
      if (status) (user as any).status = status;
      if (displayName !== undefined) (user as any).displayName = displayName;
      await user.save();
      res.json({ user });
    } catch (e) {
      const err = e as Error;
      res.status(400).json({ message: err.message });
    }
  }
);

/**
 * Admin: delete user
 */
router.delete(
  "/users/:userId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ message: "User deleted" });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: list resources (include unapproved)
 */
router.get(
  "/resources",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, type, approved, limit = "50", page = "1" } = req.query;
      const take = Math.min(200, Math.max(1, Number(limit) || 50));
      const skip = (Math.max(1, Number(page) || 1) - 1) * take;
      const query: any = {};
      if (approved === "true") query.isApproved = true;
      if (approved === "false") query.isApproved = false;
      if (type && type !== "all") query.content_type = String(type);
      if (q && String(q).trim().length > 1) query.$text = { $search: String(q).trim() };

      const [resources, total] = await Promise.all([
        Resource.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(take)
          .lean(),
        Resource.countDocuments(query),
      ]);
      res.json({ resources, pagination: { page: Number(page) || 1, limit: take, total } });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * Admin: approve/unapprove resource
 */
router.patch(
  "/resources/:resourceId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { resourceId } = req.params;
      const { isApproved } = req.body || {};
      const resource = await Resource.findById(resourceId);
      if (!resource) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }
      if (typeof isApproved === "boolean") resource.isApproved = isApproved;
      await resource.save();
      res.json({ resource });
    } catch (e) {
      const err = e as Error;
      res.status(400).json({ message: err.message });
    }
  }
);

/**
 * Admin: delete resource
 */
router.delete(
  "/resources/:resourceId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { resourceId } = req.params;
      const resource = await Resource.findByIdAndDelete(resourceId);
      if (!resource) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }
      res.json({ message: "Resource deleted" });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;

