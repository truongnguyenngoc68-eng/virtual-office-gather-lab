import mongoose, { Document, Schema } from "mongoose";

export interface IMessageAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface IMessageReaction {
  emoji: string;
  users: string[];
}

export interface IMessageReplyTo {
  id: string;
  username: string;
  message: string;
}

export interface IMessage extends Document {
  roomId: string;
  messageId: string; // stable id used by realtime + REST
  senderId: string;
  senderName: string;
  type: "nearby" | "global" | "dm" | "group";
  content: string;
  targetUserId?: string | null;
  groupId?: string | null;
  channelId?: string | null;
  recipients: string[];
  timestamp: Date;
  editedAt?: Date | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  replyTo?: IMessageReplyTo | null;
  reactions: IMessageReaction[];
  attachments: IMessageAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["nearby", "global", "dm", "group"],
      default: "global",
    },
    content: {
      type: String,
      required: true,
    },
    targetUserId: {
      type: String,
      default: null,
    },
    groupId: {
      type: String,
      default: null,
    },
    channelId: {
      type: String,
      default: null,
    },
    recipients: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: null,
    },
    replyTo: {
      type: {
        id: String,
        username: String,
        message: String,
      },
      default: null,
    },
    reactions: {
      type: [
        {
          emoji: String,
          users: [String],
        },
      ],
      default: [],
    },
    attachments: {
      type: [
        {
          filename: String,
          originalName: String,
          mimeType: String,
          size: Number,
          url: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
messageSchema.index({ roomId: 1, timestamp: -1 }); // For room messages queries
messageSchema.index({ channelId: 1, timestamp: -1 }); // For channel messages
messageSchema.index({ senderId: 1, timestamp: -1 }); // For user messages
messageSchema.index({ type: 1, timestamp: -1 }); // For message type queries
messageSchema.index({ groupId: 1, timestamp: -1 }); // For group messages
messageSchema.index({ targetUserId: 1, timestamp: -1 }); // For DM queries
messageSchema.index({ timestamp: -1 }); // General timestamp queries
messageSchema.index({ roomId: 1, messageId: 1 }, { unique: true });

export default mongoose.model<IMessage>("Message", messageSchema);

