import mongoose, { Document, Schema } from "mongoose";

export interface IEventAttendee {
  userId: string;
  username: string;
  status: "going" | "maybe" | "not_going";
  attended?: boolean;
}

export interface IEventRecurrencePattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: Date; // When recurrence ends
  occurrences?: number; // Max number of occurrences
}

export interface IEvent extends Document {
  eventId: string;
  roomId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  createdBy: string;
  attendees: IEventAttendee[];
  location: string;
  maxParticipants?: number;
  isRecurring: boolean;
  recurrencePattern?: IEventRecurrencePattern | null;
  parentEventId?: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  reminders?: Array<{
    minutesBefore: number;
    sent: boolean;
    sentAt?: Date;
  }>;
  attendance: {
    registered: number;
    attended: number;
    noShow: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String, // userId
      required: true,
    },
    attendees: [
      {
        userId: String,
        username: String,
        status: {
          type: String,
          enum: ["going", "maybe", "not_going"],
          default: "maybe",
        },
        attended: { type: Boolean, default: false },
      },
    ],
    location: {
      type: String,
      default: "",
    },
    maxParticipants: {
      type: Number,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: Schema.Types.Mixed,
      default: null,
    },
    parentEventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "EventTemplate",
      default: null,
    },
    reminders: {
      type: [
        {
          minutesBefore: Number,
          sent: { type: Boolean, default: false },
          sentAt: Date,
        },
      ],
      default: [],
    },
    attendance: {
      registered: { type: Number, default: 0 },
      attended: { type: Number, default: 0 },
      noShow: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
eventSchema.index({ roomId: 1, startTime: 1 }); // For room events sorted by time
eventSchema.index({ createdBy: 1 }); // For user's events
eventSchema.index({ startTime: 1, endTime: 1 }); // For date range queries
eventSchema.index({ isRecurring: 1 }); // For recurring events

export default mongoose.model<IEvent>("Event", eventSchema);

