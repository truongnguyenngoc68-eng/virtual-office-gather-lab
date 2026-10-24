import mongoose, { Document, Schema } from "mongoose";

export type ResourceType = "guide" | "ebook" | "course" | "video" | "audio" | "other";

export interface IResource extends Document {
  title: string;
  author?: string;
  content_type: ResourceType;
  url?: string;
  thumbnail_url?: string;
  description?: string;
  createdBy?: string | null;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    author: { type: String, trim: true, maxlength: 200 },
    content_type: {
      type: String,
      required: true,
      enum: ["guide", "ebook", "course", "video", "audio", "other"],
      default: "other",
      index: true,
    },
    url: { type: String, trim: true },
    thumbnail_url: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: String, default: null, index: true },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

resourceSchema.index({ title: "text", author: "text" });

export default mongoose.model<IResource>("Resource", resourceSchema);

