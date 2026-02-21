import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const applicationSchema = new Schema(
  {
    job: { type: Types.ObjectId, ref: "Job", required: true },
    user: { type: Types.ObjectId, ref: "User", required: true },
    resume: { type: String, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["applied", "reviewed", "interview", "hired", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ job: 1, user: 1 }, { unique: true });

const Application = model("Application", applicationSchema);
export default Application;
