import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IFriendRequest {
  from: mongoose.Types.ObjectId; // User who sent the request
  to: mongoose.Types.ObjectId; // User who received the request
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}

export interface IUser extends Document {
  username: string;
  email: string;
  discriminator: string;
  password: string;
  refreshTokens: IRefreshToken[];

  // Friends functionality
  friends: mongoose.Types.ObjectId[]; // Array of friend user IDs
  friendRequests: IFriendRequest[]; // Received friend requests
  sentFriendRequests: mongoose.Types.ObjectId[]; // Sent requests (simplified tracking)

  // Rate limiting for login attempts
  failedLoginAttempts: number;
  lockUntil: Date | undefined;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (v: string) => validator.isEmail(v),
        message: "Invalid email",
      },
    },
    discriminator: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{4}$/.test(v),
        message: "Discriminator must be 4 digits",
      },
    },
    password: { type: String, required: true },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        to: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    sentFriendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: undefined,

      // Clean lockUntil automatically after a certain time
      expiresAfterSeconds: 900, // 15 minutes (900 seconds)
    },
  },

  { timestamps: true },
);

UserSchema.index(
  { username: 1, discriminator: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

export const User = mongoose.model<IUser>("User", UserSchema);
