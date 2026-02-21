import mongoose from "mongoose";

const { Schema, model } = mongoose;

const pendingUserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["candidate", "recruiter"], required: true },
    twoFactorTempSecret: { type: String, required: true }, // hashed OTP
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 minutes
  }
);

export default model("PendingUser", pendingUserSchema); 