import mongoose from "mongoose";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import { AppError } from "../utils/AppError.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Article from "../models/Article.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";

export const getDashboardStats = async (req, res) => {
  const userId = req.user._id;
  const userCompanyId = req.user.company;

  if (!userCompanyId) {
    throw new AppError("User not associated with any company", 400);
  }

  try {
    // Get date ranges for comparisons
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total Jobs for the company
    const totalJobs = await catchAndWrap(
      () => Job.countDocuments({ company: userCompanyId }),
      "Failed to count total jobs"
    );

    // Jobs from last month for comparison
    const jobsLastMonth = await catchAndWrap(
      () =>
        Job.countDocuments({
          company: userCompanyId,
          createdAt: { $gte: lastMonth },
        }),
      "Failed to count jobs from last month"
    );

    // Total Applications for company jobs
    const companyJobs = await catchAndWrap(
      () => Job.find({ company: userCompanyId }).select("_id"),
      "Failed to fetch company jobs"
    );

    const jobIds = companyJobs.map((job) => job._id);

    const totalApplications = await catchAndWrap(
      () => Application.countDocuments({ job: { $in: jobIds } }),
      "Failed to count total applications"
    );

    // Applications from last week
    const applicationsThisWeek = await catchAndWrap(
      () =>
        Application.countDocuments({
          job: { $in: jobIds },
          createdAt: { $gte: lastWeek },
        }),
      "Failed to count applications this week"
    );

    // Total Articles by company
    const totalArticles = await catchAndWrap(
      () =>
        Article.countDocuments({
          author: userCompanyId,
          authorType: "Company",
          status: "published",
        }),
      "Failed to count total articles"
    );

    // Total article views
    const articleViewsResult = await catchAndWrap(
      () =>
        Article.aggregate([
          {
            $match: {
              author: new mongoose.Types.ObjectId(userCompanyId),
              authorType: "Company",
              status: "published",
            },
          },
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" },
            },
          },
        ]),
      "Failed to calculate article views"
    );

    const totalArticleViews = articleViewsResult[0]?.totalViews || 0;

    // Company profile views (this would need to be tracked separately)
    // For now, we'll use a placeholder or implement view tracking
    const companyViews = 0; // Placeholder - implement view tracking if needed

    // Calculate growth percentages
    const jobGrowthPercentage =
      totalJobs > 0 ? Math.round((jobsLastMonth / totalJobs) * 100) : 0;

    const stats = {
      totalJobs,
      activeJobs: await catchAndWrap(
        () => Job.countDocuments({ company: userCompanyId, status: "active" }),
        "Failed to count active jobs"
      ),
      totalApplications,
      applicationsThisWeek,
      totalArticles,
      totalArticleViews,
      companyViews,
      growth: {
        jobsPercentage: jobGrowthPercentage,
        applicationsThisWeek,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    req.log.error("Dashboard stats error:", error);
    throw new AppError("Failed to fetch dashboard statistics", 500);
  }
};

export const getTopJobs = async (req, res) => {
  const userCompanyId = req.user.company;

  if (!userCompanyId) {
    throw new AppError("User not associated with any company", 400);
  }

  const topJobs = await catchAndWrap(
    () =>
      Job.aggregate([
        { $match: { company: new mongoose.Types.ObjectId(userCompanyId) } },
        {
          $lookup: {
            from: "applications",
            localField: "_id",
            foreignField: "job",
            as: "applications",
          },
        },
        {
          $addFields: {
            applicationCount: { $size: "$applications" },
            views: { $ifNull: ["$views", 0] },
          },
        },
        {
          $sort: { applicationCount: -1, views: -1 },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            title: 1,
            status: 1,
            createdAt: 1,
            applicationCount: 1,
            views: 1,
            applications: {
              $slice: ["$applications", 3], // Get sample applications for quality assessment
            },
          },
        },
      ]),
    "Failed to fetch top jobs"
  );

  // Add applicant quality assessment (simplified)
  const jobsWithQuality = topJobs.map((job) => ({
    ...job,
    applications: job.applicationCount,
    applicantQuality:
      job.applicationCount > 20
        ? "high"
        : job.applicationCount > 10
        ? "medium"
        : "low",
    postedDate: job.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: jobsWithQuality,
  });
};

export const getCompanyMetrics = async (req, res) => {
  const userCompanyId = req.user.company;

  if (!userCompanyId) {
    throw new AppError("User not associated with any company", 400);
  }

  // Get additional company metrics
  const metrics = await catchAndWrap(async () => {
    const company = await Company.findById(userCompanyId);
    const totalEmployees = company?.members?.length || 0;

    // Get interview count (assuming you have interview tracking)
    const interviews = 0; // Placeholder - implement if you have interview model

    return {
      totalEmployees,
      interviews,
      companySize: company?.size || "Not specified",
      industry: company?.industry || "Not specified",
    };
  }, "Failed to fetch company metrics");

  res.status(200).json({
    success: true,
    data: metrics,
  });
};

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: "Contact form submitted successfully.", contact });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit contact form.", error: error.message });
  }
};
