import mongoose, { Document, Schema } from "mongoose";

export interface IObjectProperties {
  url?: string;
  content?: string; // JSON string của canvas data
  imageUrl?: string;
  documentUrl?: string;
  width?: number;
  height?: number;
  allowFullscreen?: boolean;
}

export interface IObject extends Document {
  objectId: string;
  roomId: string;
  type: "whiteboard" | "video" | "website" | "image" | "document" | "game";
  name: string;
  position: {
    x: number;
    y: number;
  };
  properties: IObjectProperties;
  createdBy?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const objectSchema = new Schema<IObject>(
  {
    objectId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["whiteboard", "video", "website", "image", "document", "game"],
    },
    name: {
      type: String,
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    properties: {
      // For video/website
      url: { type: String, default: "" },
      // For whiteboard
      content: { type: String, default: "" }, // JSON string của canvas data
      // For image
      imageUrl: { type: String, default: "" },
      // For document
      documentUrl: { type: String, default: "" },
      // Common
      width: { type: Number, default: 800 },
      height: { type: Number, default: 600 },
      allowFullscreen: { type: Boolean, default: true },
    },
    createdBy: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
objectSchema.index({ roomId: 1, isActive: 1 }); // For active objects in room
objectSchema.index({ createdBy: 1 }); // For user's objects
objectSchema.index({ type: 1, roomId: 1 }); // For type-based queries

export default mongoose.model<IObject>("Object", objectSchema);

