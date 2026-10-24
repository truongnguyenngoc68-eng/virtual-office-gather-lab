import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired sessions
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
sessionSchema.index({ userId: 1, refreshToken: 1 });

export default mongoose.model<ISession>("Session", sessionSchema);
