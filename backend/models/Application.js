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
    resumeMetadata: {
      detectedSkills: {
        type: [String],
        default: [],
      },
      textPreview: String,
      textHash: String,
      extractedAt: Date
    },
    aiScreening: {
      matchScore: Number,
      confidence: Number,
      summary: String,
      recommendation: String,
      matchedSkills: {
        type: [String],
        default: [],
      },
      missingSkills: {
        type: [String],
        default: [],
      },
      strengths: {
        type: [String],
        default: [],
      },
      concerns: {
        type: [String],
        default: [],
      },
      screeningReasons: {
        type: [String],
        default: [],
      },
      source: {
        type: String,
        enum: ["local", "gemini"],
        default: "local"
      },
      model: String, // Tracks the specific model version used (e.g. gemini-2.5-flash)
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED"],
        default: "PENDING"
      },
      version: Number,
      lastScreenedAt: Date
    },
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ job: 1, user: 1 }, { unique: true });

const Application = model("Application", applicationSchema);
export default Application;
