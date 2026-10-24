import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  googleId?: string;
  avatar: string;
  avatarConfig?: any;
  avatarColor: string;
  displayName?: string;
  status: "Available" | "Busy" | "Away" | "Do Not Disturb";
  role?: "admin" | "moderator" | "member" | "guest";
  currentRoom?: string | null;
  position: {
    x: number;
    y: number;
  };
  lastSeen: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    avatar: {
      type: String,
      default: "default",
    },
    avatarConfig: {
      type: Object,
      default: {},
    },
    avatarColor: {
      type: String,
      default: "#4f46e5",
    },
    displayName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Busy", "Away", "Do Not Disturb"],
    },
    role: {
      type: String,
      default: "member",
      enum: ["admin", "moderator", "member", "guest"],
    },
    currentRoom: {
      type: String,
      default: null,
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
userSchema.index({ currentRoom: 1 }); // For room user queries
userSchema.index({ role: 1 }); // For role-based queries
userSchema.index({ lastSeen: -1 }); // For active users queries

export default mongoose.model<IUser>("User", userSchema);

