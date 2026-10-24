import mongoose, { Document, Schema } from "mongoose";

export interface IRoomMember extends Document {
  roomId: string;
  userId: string;
  username: string;
  avatar: string;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  role: "admin" | "member";
  createdAt?: Date;
  updatedAt?: Date;
}

const roomMemberSchema = new Schema<IRoomMember>(
  {
    roomId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true }); // Compound unique index
roomMemberSchema.index({ userId: 1 }); // For user's rooms queries
roomMemberSchema.index({ roomId: 1, isOnline: 1 }); // For online users in room
roomMemberSchema.index({ roomId: 1, role: 1 }); // For admin/member queries per room
roomMemberSchema.index({ isOnline: 1, lastSeen: -1 }); // For active users queries

export default mongoose.model<IRoomMember>("RoomMember", roomMemberSchema);

