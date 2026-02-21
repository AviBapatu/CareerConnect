import mongoose from "mongoose";

const { Schema, model } = mongoose;

const experienceSchema = new Schema(
  {
    company: { type: String, required: true },
    title: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: String,
    location: String,
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    school: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: String,
    startDate: { type: String, required: true },
    endDate: { type: String },
    grade: String,
    description: String,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Global role: determines if the user is a job seeker or recruiter
    role: {
      type: String,
      enum: ["candidate", "recruiter"],
      default: "candidate",
      required: true,
    },

    avatarUrl: String,
    avatarPublicId: String,

    resumeUrl: String,
    resumePublicId: String,

    headline: String,
    about: String,
    location: String,
    skills: [String],
    experience: [experienceSchema],
    education: [educationSchema],

    social: {
      github: String,
      linkedin: String,
      twitter: String,
      portfolio: String,
    },

    isOpenToWork: { type: Boolean, default: false },

    company: { type: Schema.Types.ObjectId, ref: "Company" },

    // Role inside the company (separate from account role)
    companyRole: {
      type: String,
      enum: ["employee", "recruiter", "admin"],
    },

    // Incoming company join requests
    companyJoinRequests: [
      {
        company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
        roleTitle: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],

    // 2FA fields
    twoFactorEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for connections
userSchema.virtual("connections", {
  ref: "Connection",
  localField: "_id",
  foreignField: "requester",
});

userSchema.virtual("followers", {
  ref: "Connection",
  localField: "_id",
  foreignField: "recipient",
});

const User = model("User", userSchema);
export default User;
