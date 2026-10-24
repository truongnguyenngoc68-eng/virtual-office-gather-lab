import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type:
    | "event_reminder"
    | "event_invite"
    | "forum_mention"
    | "forum_reply"
    | "forum_like"
    | "message"
    | "friend_request"
    | "system";
  title: string;
  message: string;
  link?: string; // URL to navigate to
  relatedId?: string; // ID of related entity (eventId, postId, etc.)
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "event_reminder",
        "event_invite",
        "forum_mention",
        "forum_reply",
        "forum_like",
        "message",
        "friend_request",
        "system",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
    },
    relatedId: {
      type: String,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
