import User from "../models/User.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import { AppError } from "../utils/AppError.js";
import { cloudinary } from "../config/cloudinary.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Article from "../models/Article.js";
import bcrypt from "bcryptjs";

const allowedFields = [
  "name",
  "headline",
  "about",
  "location",
  "skills",
  "social",
  "experience",
  "education",
  "isOpenToWork",
  "company",
];

export const getProfile = async (req, res) => {
  if (!req.user?.id) throw new AppError("Invalid ID", 400);

  const user = await catchAndWrap(
    () => User.findById(req.user.id),
    "User not found",
    404
  );
  req.log.info(user);

  res.status(200).json(user);
};

export const getUserById = async (req, res) => {
  const { userId } = req.params;

  if (!userId) throw new AppError("User ID is required", 400);

  const user = await catchAndWrap(
    () => User.findById(userId).select("-password"),
    "User not found",
    404
  );

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const updateProfileAvatar = async (req, res) => {
  try {
    req.log.info("Avatar upload request:", {
      userId: req.user?.id,
      file: req.file
        ? {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : null,
    });

    if (!req.user.id) throw new AppError("Unauthorized access", 401);
    if (!req.file) throw new AppError("Avatar not found", 400);

    const user = await catchAndWrap(
      () => User.findById(req.user.id),
      "User not found",
      404
    );

    // Delete old avatar if exists
    if (user.avatarPublicId) {
      req.log.info("Deleting old avatar:", user.avatarPublicId);
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    // Update only avatar-related fields using findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatarUrl: req.file.path,
        avatarPublicId: req.file.filename,
      },
      { new: true, runValidators: false } // Skip validation to avoid name required error
    );

    req.log.info("Avatar upload successful:", {
      avatarUrl: updatedUser.avatarUrl,
      avatarPublicId: updatedUser.avatarPublicId,
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    req.log.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar",
      error: error.stack,
    });
  }
};

export const updateProfile = async (req, res) => {
  if (!req.user?.id) throw new AppError("Unauthorized", 401);

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Special handling for education array
      if (field === "education" && Array.isArray(req.body.education)) {
        updates.education = req.body.education.map((edu) => {
          return {
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          };
        });
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  const user = await catchAndWrap(
    () =>
      User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: false,
      }),
    "Failed to update profile",
    400
  );

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user,
  });
};

export const updateResume = async (req, res) => {
  try {
    req.log.info("Resume upload request:", {
      userId: req.user?.id,
      file: req.file
        ? {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : null,
    });

    if (!req.user?.id) throw new AppError("Unauthorized", 401);
    if (!req.file) throw new AppError("Resume not found", 400);

    const user = await catchAndWrap(
      () => User.findById(req.user.id),
      "User not found",
      404
    );

    // Delete old resume if exists
    if (user.resumePublicId) {
      req.log.info("Deleting old resume:", user.resumePublicId);
      await cloudinary.uploader.destroy(user.resumePublicId);
    }

    // Update only resume-related fields using findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        resumeUrl: req.file.path,
        resumePublicId: req.file.filename,
      },
      { new: true, runValidators: false } // Skip validation to avoid name required error
    );

    req.log.info("Resume upload successful:", {
      resumeUrl: updatedUser.resumeUrl,
      resumePublicId: updatedUser.resumePublicId,
    });

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    req.log.error("Resume upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload resume",
      error: error.stack,
    });
  }
};

export const deleteResume = async (req, res) => {
  try {
    if (!req.user?.id) throw new AppError("Unauthorized", 401);

    const user = await catchAndWrap(
      () => User.findById(req.user.id),
      "User not found",
      404
    );

    if (user.resumePublicId) {
      req.log.info("Deleting resume from cloudinary:", user.resumePublicId);
      await cloudinary.uploader.destroy(user.resumePublicId);

      // Update only resume-related fields using findByIdAndUpdate to avoid validation issues
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          $unset: {
            resumeUrl: 1,
            resumePublicId: 1,
          },
        },
        { new: true, runValidators: false }
      );

      res.status(200).json({
        success: true,
        message: "Resume deleted successfully",
        user: updatedUser,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "No resume to delete",
      });
    }
  } catch (error) {
    req.log.error("Delete resume error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete resume",
      error: error.stack,
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    if (!req.user?.id) throw new AppError("Unauthorized", 401);

    const user = await catchAndWrap(
      () => User.findById(req.user.id),
      "User not found",
      404
    );

    if (user.avatarPublicId) {
      req.log.info("Deleting avatar from cloudinary:", user.avatarPublicId);
      await cloudinary.uploader.destroy(user.avatarPublicId);

      // Update only avatar-related fields using findByIdAndUpdate to avoid validation issues
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          $unset: {
            avatarUrl: 1,
            avatarPublicId: 1,
          },
        },
        { new: true, runValidators: false }
      );

      res.status(200).json({
        success: true,
        message: "Avatar deleted successfully",
        user: updatedUser,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "No avatar to delete",
      });
    }
  } catch (error) {
    req.log.error("Delete avatar error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete avatar",
      error: error.stack,
    });
  }
};

export const deleteProfile = async (req, res) => {
  if (!req.user?.id) throw new AppError("Unauthorized", 401);

  const { password } = req.body || req.body === undefined ? req.body : req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required to delete your account." });
  }

  const user = await catchAndWrap(
    () => User.findById(req.user.id),
    "User not found",
    404
  );

  if (!user) throw new AppError("User not found", 404);

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Incorrect password. Account not deleted." });
  }

  // If user is admin, delete company, jobs, and articles
  if (user.role === "recruiter" && user.companyRole === "admin" && user.company) {
    await Job.deleteMany({ company: user.company });
    await Article.deleteMany({ author: user.company, authorType: "Company" });
    await Company.findByIdAndDelete(user.company);
  }

  if (user.avatarPublicId)
    await cloudinary.uploader.destroy(user.avatarPublicId);
  if (user.resumePublicId)
    await cloudinary.uploader.destroy(user.resumePublicId);

  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    success: true,
    message: "Profile deleted permanently",
  });
};
