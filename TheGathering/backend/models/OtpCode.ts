import mongoose, { Document, Schema } from "mongoose";

export type OtpPurpose = "register" | "reset";

export interface IOtpCode extends Document {
  email: string;
  code: string;
  purpose: OtpPurpose;
  used: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const otpSchema = new Schema<IOtpCode>(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ["register", "reset"],
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "15m" }, // auto-clean after 15 minutes
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.model<IOtpCode>("OtpCode", otpSchema);

