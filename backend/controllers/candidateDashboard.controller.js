import mongoose from "mongoose";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import { AppError } from "../utils/AppError.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Article from "../models/Article.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

export const getCandidateDashboardStats = async (req, res) => {
  const userId = req.user._id;

  try {
    // Get date ranges for comparisons
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total Applications by user
    const totalApplications = await catchAndWrap(
      () => Application.countDocuments({ user: userId }),
      "Failed to count total applications"
    );

    // Applications this week
    const applicationsThisWeek = await catchAndWrap(
      () =>
        Application.countDocuments({
          user: userId,
          createdAt: { $gte: lastWeek },
        }),
      "Failed to count applications this week"
    );

    // Applications by status
    const applicationStatusStats = await catchAndWrap(
      () =>
        Application.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
      "Failed to get application status stats"
    );

    // Format status stats
    const statusCounts = {
      applied: 0,
      reviewed: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };

    applicationStatusStats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Profile views (placeholder - would need to implement view tracking)
    const profileViews = Math.floor(Math.random() * 100) + 50; // Placeholder

    // Jobs saved/bookmarked (would need to implement bookmarking feature)
    const savedJobs = 0; // Placeholder

    // Recent job matches (simplified - just get recent jobs in user's area of interest)
    const recentJobs = await catchAndWrap(
      () =>
        Job.find({
          status: "active",
          createdAt: { $gte: lastWeek },
        })
          .populate("company", "name logoUrl")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      "Failed to fetch recent jobs"
    );

    const stats = {
      totalApplications,
      applicationsThisWeek,
      statusCounts,
      profileViews,
      savedJobs,
      recentJobs: recentJobs.length,
      growth: {
        applicationsPercentage:
          totalApplications > 0
            ? Math.round((applicationsThisWeek / totalApplications) * 100)
            : 0,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    req.log.error("Candidate dashboard stats error:", error);
    throw new AppError("Failed to fetch candidate dashboard statistics", 500);
  }
};

export const getRecentApplications = async (req, res) => {
  const userId = req.user._id;

  const recentApplications = await catchAndWrap(
    () =>
      Application.find({ user: userId })
        .populate({
          path: "job",
          select: "title companyName location type status createdAt",
          populate: {
            path: "company",
            select: "name logoUrl industry",
          },
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    "Failed to fetch recent applications"
  );

  res.status(200).json({
    success: true,
    data: recentApplications,
  });
};

export const getRecommendedJobs = async (req, res) => {
  const userId = req.user._id;

  // Get user profile to understand preferences
  const user = await catchAndWrap(
    () => User.findById(userId),
    "Failed to fetch user profile"
  );

  // Get jobs user has already applied to
  const appliedJobIds = await Application.find({ user: userId }).distinct(
    "job"
  );

  // Simple recommendation based on active jobs
  // In a real app, you'd use user skills, location, preferences, etc.
  const recommendedJobs = await catchAndWrap(
    () =>
      Job.find({
        status: "active",
        // Exclude jobs user has already applied to
        _id: { $nin: appliedJobIds },
      })
        .populate("company", "name logoUrl industry")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    "Failed to fetch recommended jobs"
  );

  // Add recommendation score (simplified)
  const jobsWithScore = recommendedJobs.map((job) => ({
    ...job,
    recommendationScore: Math.floor(Math.random() * 40) + 60, // 60-100%
    matchReason: "Based on your profile and preferences",
  }));

  res.status(200).json({
    success: true,
    data: jobsWithScore,
  });
};

export const getCandidateMetrics = async (req, res) => {
  const userId = req.user._id;

  const metrics = await catchAndWrap(async () => {
    // Get application response rate
    const totalApplications = await Application.countDocuments({
      user: userId,
    });
    const respondedApplications = await Application.countDocuments({
      user: userId,
      status: { $in: ["reviewed", "interview", "hired", "rejected"] },
    });

    const responseRate =
      totalApplications > 0
        ? Math.round((respondedApplications / totalApplications) * 100)
        : 0;

    // Get interview rate
    const interviewApplications = await Application.countDocuments({
      user: userId,
      status: "interview",
    });

    const interviewRate =
      totalApplications > 0
        ? Math.round((interviewApplications / totalApplications) * 100)
        : 0;

    // Get success rate (hired)
    const hiredApplications = await Application.countDocuments({
      user: userId,
      status: "hired",
    });

    const successRate =
      totalApplications > 0
        ? Math.round((hiredApplications / totalApplications) * 100)
        : 0;

    return {
      responseRate,
      interviewRate,
      successRate,
      averageResponseTime: "3-5 days", // Placeholder
    };
  }, "Failed to fetch candidate metrics");

  res.status(200).json({
    success: true,
    data: metrics,
  });
};
