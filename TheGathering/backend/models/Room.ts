import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  roomId: string;
  name: string;
  description: string;
  maxUsers: number;
  isPrivate: boolean;
  isActive: boolean;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    maxUsers: {
      type: Number,
      default: 20, // Hỗ trợ tối đa 20 users (có thể tăng qua settings)
      min: 20, // Đảm bảo tối thiểu 20 users
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
roomSchema.index({ createdBy: 1 }); // For user's rooms queries
roomSchema.index({ isPrivate: 1 }); // For public/private room queries
roomSchema.index({ isActive: 1 }); // For active room queries

export default mongoose.model<IRoom>("Room", roomSchema);

