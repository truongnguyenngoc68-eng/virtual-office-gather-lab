import mongoose, { Document, Schema } from "mongoose";

export interface IEventTemplate extends Document {
  name: string;
  description?: string;
  duration: number; // Minutes
  defaultLocation?: string;
  defaultMaxParticipants?: number;
  defaultReminders?: number[]; // Minutes before event
  category?: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventTemplateSchema = new Schema<IEventTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 60, // 1 hour default
    },
    defaultLocation: {
      type: String,
      trim: true,
    },
    defaultMaxParticipants: {
      type: Number,
    },
    defaultReminders: {
      type: [Number],
      default: [15, 60], // 15 minutes and 1 hour before
    },
    category: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventTemplateSchema.index({ createdBy: 1, isPublic: 1 });
eventTemplateSchema.index({ category: 1 });

export default mongoose.model<IEventTemplate>("EventTemplate", eventTemplateSchema);
