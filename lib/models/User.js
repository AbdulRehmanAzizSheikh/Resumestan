import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide your username"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide your password"],
      trim: true,
      minLength: 8,
    },
    verify: {
      status: {
        type: Boolean,
        default: false,
      },
      otp: {
        code: {
          type: String,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
    },
    canvaAccounts: {
      type: [
        {
          canvaUserId: { type: String, required: true },
          accountName: { type: String, default: "Canva account" },
          accessToken: { type: String, required: true, select: false },
          refreshToken: { type: String, default: "", select: false },
          expiresAt: { type: Date, default: null },
          connectedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    // Short-lived state token stored during Canva OAuth flow.
    // Lets the callback identify the user without relying on a cookie
    // (needed because Canva redirects to 127.0.0.1 while the browser
    // session cookie may be scoped to localhost).
    pendingCanvaState: {
      state: { type: String, default: null },
      verifier: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);const User = models.users || model("users", userSchema);

export default User;
