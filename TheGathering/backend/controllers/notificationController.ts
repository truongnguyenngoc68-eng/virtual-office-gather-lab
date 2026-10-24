import { Request, Response } from "express";
import Notification from "../models/Notification.js";
import { logger } from "../utils/logger.js";

/**
 * Get notifications for current user
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { unreadOnly = false, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    logger.error("Failed to fetch notifications", error as Error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    logger.error("Failed to mark notification as read", error as Error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    logger.error("Failed to mark all notifications as read", error as Error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    logger.error("Failed to delete notification", error as Error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

/**
 * Create notification (internal use)
 */
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  relatedId?: string
): Promise<void> => {
  try {
    await Notification.create({
      userId,
      type: type as any,
      title,
      message,
      link,
      relatedId,
      isRead: false,
    });
  } catch (error) {
    logger.error("Failed to create notification", error as Error);
  }
};

/**
 * Send event reminder notification
 */
export const sendEventReminder = async (
  userId: string,
  eventTitle: string,
  eventId: string,
  minutesBefore: number
): Promise<void> => {
  await createNotification(
    userId,
    "event_reminder",
    `Event Reminder: ${eventTitle}`,
    `Your event "${eventTitle}" starts in ${minutesBefore} minutes`,
    `/app/calendar?event=${eventId}`,
    eventId
  );
};

/**
 * Send forum mention notification
 */
export const sendForumMention = async (
  userId: string,
  username: string,
  postId: string,
  topicId: string
): Promise<void> => {
  await createNotification(
    userId,
    "forum_mention",
    `You were mentioned by ${username}`,
    `${username} mentioned you in a post`,
    `/app/forum/topic/${topicId}`,
    postId
  );
};

/**
 * Send forum reply notification
 */
export const sendForumReply = async (
  userId: string,
  username: string,
  postId: string,
  topicId: string
): Promise<void> => {
  await createNotification(
    userId,
    "forum_reply",
    `New reply from ${username}`,
    `${username} replied to your post`,
    `/app/forum/topic/${topicId}`,
    postId
  );
};
