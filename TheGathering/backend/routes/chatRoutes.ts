import express, { Request, Response } from "express";
import Message from "../models/Message.js";

const router = express.Router();

router.get("/history/:roomId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { limit = 100, skip = 0, type, channelId } = req.query;
    
    // Validate and sanitize inputs
    const limitNum = Math.min(Number(limit) || 100, 500); // Max 500 messages
    const skipNum = Math.max(Number(skip) || 0, 0);
    
    interface QueryType {
      roomId: string;
      type?: string;
      channelId?: string;
      isDeleted?: any;
    }
    const query: QueryType = { roomId, isDeleted: { $ne: true } };
    if (type) {
      query.type = type as string;
    }
    if (channelId) {
      query.channelId = channelId as string;
    }
    
    // Use indexes for better performance
    const messages = await Message.find(query)
      .sort({ timestamp: -1 }) // Sort descending (newest first) for pagination
      .skip(skipNum)
      .limit(limitNum)
      .lean()
      .exec(); // Use exec() for better performance

    // Transform to match frontend ChatMessage format
    // Reverse to get chronological order (oldest first)
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg.messageId || msg._id.toString(),
      userId: msg.senderId,
      username: msg.senderName,
      message: msg.content,
      type: msg.type,
      targetUserId: msg.targetUserId || null,
      groupId: msg.groupId || null,
      channelId: msg.channelId || null,
      timestamp: new Date(msg.timestamp).getTime(),
      editedAt: msg.editedAt ? new Date(msg.editedAt).getTime() : undefined,
      replyTo: msg.replyTo || undefined,
      reactions: msg.reactions || [],
    }));

    // Get total count for pagination info
    const totalCount = await Message.countDocuments(query);

    res.json({
      messages: formattedMessages,
      pagination: {
        total: totalCount,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + limitNum < totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch chat history", error);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

// Search messages endpoint
router.get("/search/:roomId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { q, type, channelId, limit = 50 } = req.query;

    if (!q || (typeof q === "string" && q.trim().length === 0)) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    interface QueryType {
      roomId: string;
      content: { $regex: string; $options: string };
      type?: string;
      channelId?: string;
      isDeleted?: any;
    }

    const query: QueryType = {
      roomId,
      content: { $regex: q as string, $options: "i" }, // Case-insensitive search
      isDeleted: { $ne: true },
    };

    if (type) {
      query.type = type as string;
    }
    if (channelId) {
      query.channelId = channelId as string;
    }

    // Validate limit
    const limitNum = Math.min(Number(limit) || 50, 100); // Max 100 results
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(limitNum)
      .lean()
      .exec(); // Use exec() for better performance

    const formattedMessages = messages.map((msg) => ({
      id: msg.messageId || msg._id.toString(),
      userId: msg.senderId,
      username: msg.senderName,
      message: msg.content,
      type: msg.type,
      targetUserId: msg.targetUserId || null,
      groupId: msg.groupId || null,
      channelId: msg.channelId || null,
      timestamp: new Date(msg.timestamp).getTime(),
      editedAt: msg.editedAt ? new Date(msg.editedAt).getTime() : undefined,
      replyTo: msg.replyTo || undefined,
      reactions: msg.reactions || [],
    }));

    res.json({
      query: q,
      results: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
    console.error("Failed to search messages", error);
    res.status(500).json({ message: "Failed to search messages" });
  }
});

export default router;

