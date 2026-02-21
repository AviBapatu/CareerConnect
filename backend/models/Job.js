import mongoose from "mongoose";
const { Schema, model } = mongoose;

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "full-time",
        "part-time",
        "internship",
        "contract",
        "freelance",
        "remote",
      ],
      required: true,
    },

    industry: { type: String },

    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },

    applicationInstructions: { type: String },

    logoUrl: { type: String },
    logoPublicId: { type: String },

    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ location: 1, createdAt: -1 });

const Job = model("Job", jobSchema);
export default Job;
