import mongoose, { Document, Schema } from "mongoose";

export interface IAnalytics extends Document {
  eventType: "page_view" | "user_action" | "error" | "performance" | "custom";
  userId?: string;
  sessionId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    eventType: {
      type: String,
      required: true,
      enum: ["page_view", "user_action", "error", "performance", "custom"],
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });
analyticsSchema.index({ eventName: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index to auto-delete old analytics (optional, keep 90 days)
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IAnalytics>("Analytics", analyticsSchema);
