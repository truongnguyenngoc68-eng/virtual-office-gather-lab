import express, { Request, Response } from "express";
import Analytics from "../models/Analytics.js";
import { logger } from "../utils/logger.js";
import { authenticate, optionalAuthenticate } from "../middleware/security.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

// Track analytics event (public endpoint, but can include userId if authenticated)
router.post("/track", optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, eventName, properties, sessionId } = req.body;
    const userId = (req as any).userId;

    if (!eventType || !eventName || !sessionId) {
      res.status(400).json({ message: "eventType, eventName, and sessionId are required" });
      return;
    }

    const validEventTypes = ["page_view", "user_action", "error", "performance", "custom"];
    if (!validEventTypes.includes(eventType)) {
      res.status(400).json({ message: "Invalid eventType" });
      return;
    }

    // Create analytics entry
    const analytics = await Analytics.create({
      eventType,
      eventName,
      properties: properties || {},
      sessionId,
      userId: userId || undefined,
      timestamp: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    });

    logger.debug("Analytics event tracked", {
      eventType,
      eventName,
      userId,
      sessionId,
    });

    res.status(201).json({ success: true, id: analytics._id });
  } catch (error) {
    logger.error("Failed to track analytics event", error as Error);
    res.status(500).json({ message: "Failed to track event" });
  }
});

// Get analytics (admin only)
router.get("/events", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Add admin check
    const { eventType, userId, sessionId, startDate, endDate, limit = 100 } = req.query;

    const query: any = {};

    if (eventType) {
      query.eventType = eventType;
    }
    if (userId) {
      query.userId = userId;
    }
    if (sessionId) {
      query.sessionId = sessionId;
    }
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    const events = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ events, count: events.length });
  } catch (error) {
    logger.error("Failed to fetch analytics events", error as Error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get analytics summary
router.get("/summary", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Add admin check
    const { startDate, endDate } = req.query;

    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.timestamp = {};
      if (startDate) {
        dateQuery.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateQuery.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Get counts by event type
    const eventTypeCounts = await Analytics.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get unique users
    const uniqueUsers = await Analytics.distinct("userId", dateQuery);

    // Get unique sessions
    const uniqueSessions = await Analytics.distinct("sessionId", dateQuery);

    // Get top events
    const topEvents = await Analytics.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$eventName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      eventTypeCounts,
      uniqueUsers: uniqueUsers.filter(Boolean).length,
      uniqueSessions: uniqueSessions.length,
      topEvents,
    });
  } catch (error) {
    logger.error("Failed to fetch analytics summary", error as Error);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

export default router;
