import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { AppError } from "../utils/AppError.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import {
  applySchema,
  postJobSchema,
  getAllMyApplicationsSchema,
  getJobStatusSchema,
  getAllApplicationsSchema,
  updateJobStatusSchema,
  updateApplicationStatusSchema,
  getJobPostsSchema,
  deleteJobSchema,
  deleteApplicationSchema,
  deleteJobByIdSchema,
} from "../zodSchema/job.validation.js";
import Company from "../models/Company.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { jobOptions } from "../utils/queryOperations/jobOptions.js";
import mongoose from "mongoose";
import { sendCustomEmail } from "../utils/sendEmail.js";

export const deleteJobById = async (req, res) => {
  const parsed = deleteJobByIdSchema.safeParse({ params: req.params });
  if (!parsed.success) {
    req.log.error(parsed.error);
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const { id } = parsed.data.params;
  const deleted = await catchAndWrap(
    () => Job.findByIdAndDelete(id),
    "Failed to delete job",
    404
  );
  if (!deleted) throw new AppError("Job not found", 404);
  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
};

export const applyToJob = async (req, res) => {
  const userId = req.user._id;
  const { jobId } = req.params;

  // Check if user has a resume
  if (!req.user.resumeUrl) {
    throw new AppError(
      "You must upload a resume before applying for a job.",
      400
    );
  }

  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    req.log.error(parsed.error);
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const job = await catchAndWrap(
      () => Job.findById(jobId).session(session),
      "Job not found",
      404
    );
    if (!job) throw new AppError("Job does not exist", 404);

    const existing = await catchAndWrap(
      () => Application.findOne({ job: jobId, user: userId }).session(session),
      "Failed to check existing application"
    );
    if (existing) throw new AppError("You already applied to this job", 400);

    const applicationArr = await catchAndWrap(
      () =>
        Application.create(
          [
            {
              job: jobId,
              user: userId,
              resume: parsed.data.resume,
              coverLetter: parsed.data.coverLetter,
            },
          ],
          { session }
        ),
      "Failed to submit application"
    );

    await catchAndWrap(
      () =>
        Job.findByIdAndUpdate(
          jobId,
          { $push: { applications: applicationArr[0]._id } },
          { session }
        ),
      "Failed to update job with application"
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: applicationArr[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const postJob = async (req, res) => {
  //   req.log.info(req.user);
  const user = req.user;

  const parsed = postJobSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const jobData = parsed.data;

  if (!user.company) {
    throw new AppError("You must be part of a company to post jobs", 403);
  }
  req.log.info("user.company", user.company);

  const company = await catchAndWrap(
    () => Company.findById(user.company),
    "Failed to find company"
  );
  if (!company) throw new AppError("Company not found", 404);

  const job = new Job({
    ...jobData,
    company: company._id,
    companyName: company.name,
    postedBy: user._id,
  });

  await catchAndWrap(() => job.save(), "Failed to post job");

  res.status(201).json({
    success: true,
    message: "Job posted successfully",
    job,
  });
};

export const getAApplication = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user._id;

  const application = await catchAndWrap(
    () => Application.findOne({ job: jobId, user: userId }).populate("job"),
    "Failed to fetch your application for this job"
  );

  if (!application) throw new AppError("Application not found", 404);

  res.status(200).json({
    success: true,
    data: application,
  });
};

export const getAllMyApplications = async (req, res) => {
  req.log.info("getAllMyApplications called with:", {
    query: req.query,
    userId: req.user?._id,
    user: req.user ? "exists" : "missing",
  });

  const parsed = getAllMyApplicationsSchema.safeParse({
    query: req.query,
  });
  if (!parsed.success) {
    req.log.error("Validation failed:", parsed.error);
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const userId = req.user._id;
  const { status } = parsed.data.query;

  const filter = { user: userId };
  if (status) filter.status = status;

  const applications = await catchAndWrap(
    () =>
      Application.find(filter)
        .populate({
          path: "job",
          select: "title companyName location type status createdAt",
          populate: {
            path: "company",
            select: "name logoUrl",
          },
        })
        .sort({ createdAt: -1 }),
    "Failed to fetch applications"
  );

  req.log.info("Applications found:", {
    count: applications.length,
    applications: applications.map((app) => ({
      id: app._id,
      status: app.status,
      jobTitle: app.job?.title,
      user: app.user,
    })),
  });

  res.status(200).json({
    success: true,
    data: applications,
  });
};

export const getJobStatus = async (req, res) => {
  const parsed = getJobStatusSchema.safeParse(req);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const userId = req.user._id;
  const { jobId } = parsed.data.params;

  const application = await catchAndWrap(
    () =>
      Application.findOne({ job: jobId, user: userId }).populate({
        path: "job",
        select: "title companyName",
      }),
    "Failed to fetch application status"
  );

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      status: application.status,
      appliedAt: application.createdAt,
      jobTitle: application.job?.title,
      companyName: application.job?.companyName,
    },
  });
};

export const getAllApplicationForAJob = async (req, res) => {
  const parsed = getAllApplicationsSchema.safeParse(req);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { jobId } = parsed.data.params;
  const userCompanyId = req.user.company;

  const job = await catchAndWrap(
    () => Job.findById(jobId),
    "Failed to fetch job"
  );

  if (!job) throw new AppError("Job not found", 404);
  if (String(job.company) !== String(userCompanyId)) {
    throw new AppError("Unauthorized to view applications for this job", 403);
  }

  const applications = await catchAndWrap(
    () =>
      Application.find({ job: jobId }).populate({
        path: "user",
        select: "name email resume",
      }),
    "Failed to fetch applications"
  );

  res.status(200).json({
    success: true,
    data: applications,
  });
};

export const updateJobStatus = async (req, res) => {
  const parsed = updateJobStatusSchema.safeParse({
    params: req.params,
    body: req.body,
  });
  req.log.info("Validation error details:", parsed.error);
  req.log.info(req.params, req.body);

  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { companyId, jobId } = parsed.data.params;
  const { status } = parsed.data.body;

  const job = await catchAndWrap(
    () => Job.findOne({ _id: jobId, company: companyId }),
    "Failed to find job post",
    404
  );

  if (!job) {
    throw new AppError("Job not found", 404);
  }
  // req.log.info("status:", status);
  job.status = status;

  const updated = await catchAndWrap(
    () => job.save(),
    "Failed to update job status"
  );

  res.status(200).json({
    success: true,
    message: "Job application status updated successfully",
    data: updated,
  });
};

export const updateApplicationStatus = async (req, res) => {
  req.log.info(req.params, ",", req.body);
  const parsed = updateApplicationStatusSchema.safeParse({
    params: req.params,
    body: req.body,
  });

  if (!parsed.success) {
    throw new AppError(
      "Validation failed for schema",
      400,
      parsed.error.issues
    );
  }

  const { companyId, applicationId } = parsed.data.params;
  const { status } = parsed.data.body;

  const application = await catchAndWrap(
    () =>
      Application.findOne({ _id: applicationId }).populate({
        path: "job",
        select: "company",
      }),
    "Failed to fetch application",
    404
  );

  if (!application || application.job.company.toString() !== companyId) {
    throw new AppError("Application not found under this company", 404);
  }

  application.status = status;

  await catchAndWrap(() => application.save(), "Failed to update status");

  res.status(200).json({
    success: true,
    message: "Application status updated",
  });
};

export const getJobPosts = async (req, res) => {
  const parsed = getJobPostsSchema.safeParse({
    params: req.params,
    query: req.query,
  });
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { jobId } = parsed.data.params;
  const query = parsed.data.query;

  if (jobId) {
    const job = await catchAndWrap(
      () => Job.findById(jobId).populate("company", "name industry").lean(),
      "Job not found",
      404
    );

    return res.status(200).json({
      success: true,
      message: "Job post fetched successfully",
      data: job,
    });
  }

  const filter = jobOptions(query);
  const jobs = await Job.find(filter)
    .select("title location salary company companyName type createdAt")
    .populate("company", "name industry")
    .lean();

  res.status(200).json({
    success: true,
    message: "Filtered job posts fetched successfully",
    data: jobs,
  });
};

export const getMyJobPosts = async (req, res) => {
  const userId = req.user._id;

  // Get jobs and calculate application counts
  const jobs = await Job.aggregate([
    { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
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
        applicationsCount: { $size: "$applications" },
      },
    },
    {
      $project: {
        applications: 0, // Remove the applications array, keep only the count
      },
    },
  ]);

  res.status(200).json({ success: true, jobs });
};

export const getAllJobs = async (req, res) => {
  const { search } = req.query;
  let filter = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter = {
      $or: [
        { title: regex },
        { description: regex },
        { companyName: regex },
        { location: regex },
      ],
    };
  }
  const jobs = await Job.find(filter)
    .select("title location salary company companyName type createdAt")
    .populate("company")
    .lean();
  res.status(200).json({ success: true, jobs });
};

export const getJobsByCompany = async (req, res) => {
  req.log.info("🔍 getJobsByCompany called");
  req.log.info("Query params:", req.query);
  req.log.info("Full URL:", req.originalUrl);

  const { company } = req.query;
  if (!company) {
    req.log.info("❌ No company query param provided");
    return res
      .status(400)
      .json({ success: false, message: "company query param is required" });
  }

  req.log.info("🔍 Searching for jobs with company:", company);
  try {
    const jobs = await Job.find({ company })
      .select("title location salary company companyName type createdAt")
      .lean();
    req.log.info("✅ Found jobs:", jobs.length);
    req.log.info("Jobs data:", jobs);
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    req.log.error("❌ Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

export const deleteJobPost = async (req, res) => {
  const parsed = deleteJobSchema.safeParse({ params: req.params });
  if (!parsed.success) {
    req.log.error(parsed.error); // Add this for debugging
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { companyId, jobId } = parsed.data.params;

  const deleted = await catchAndWrap(
    () => Job.findOneAndDelete({ _id: jobId, company: companyId }),
    "Failed to delete job post",
    404
  );

  if (!deleted) throw new AppError("Job not found", 404);

  res.status(200).json({
    success: true,
    message: "Job post deleted successfully",
  });
};

export const deleteApplication = async (req, res) => {
  const parsed = deleteApplicationSchema.safeParse({ params: req.params });
  if (!parsed.success)
    throw new AppError("Validation failed", 400, parsed.error.errors);

  const { jobId, applicationId } = parsed.data.params;
  // req.log.info(jobId, applicationId);

  const deleted = await catchAndWrap(
    () => Application.findOneAndDelete({ _id: applicationId, job: jobId }),
    "Failed to delete application",
    404
  );

  if (!deleted) throw new AppError("Application not found", 404);

  res.status(200).json({
    success: true,
    message: "Job application deleted successfully",
  });
};

export const editJob = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Validate input (reuse postJobSchema for simplicity)
  const parsed = postJobSchema.safeParse(req.body);
  if (!parsed.success) {
    req.log.error(parsed.error);
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const jobData = parsed.data;

  // Find the job
  const job = await catchAndWrap(() => Job.findById(id), "Job not found", 404);
  if (!job) throw new AppError("Job not found", 404);

  // Only allow if user is recruiter/admin of the company
  if (!user.company || String(job.company) !== String(user.company)) {
    throw new AppError("Unauthorized to edit this job", 403);
  }
  if (user.companyRole !== "admin" && user.companyRole !== "recruiter") {
    throw new AppError("Only admins and recruiters can edit jobs", 403);
  }

  // Update fields
  job.title = jobData.title;
  job.description = jobData.description;
  job.salary = jobData.salary;
  job.type = jobData.type;
  job.requirements = jobData.requirements;

  await catchAndWrap(() => job.save(), "Failed to update job");

  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    job,
  });
};

export const getJobById = async (req, res) => {
  req.log.info("🔍 getJobById called");
  req.log.info("Params:", req.params);
  req.log.info("Query:", req.query);
  req.log.info("Full URL:", req.originalUrl);

  const { id } = req.params;
  req.log.info("🔍 Searching for job with ID:", id);

  const job = await Job.findById(id).lean();
  if (!job) {
    req.log.info("❌ Job not found with ID:", id);
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  req.log.info("✅ Found job:", job.title);
  res.status(200).json(job);
};

export const getAllApplicationsForCompany = async (req, res) => {
  const userCompanyId = req.user.company;

  if (!userCompanyId) {
    throw new AppError(
      "You must be part of a company to view applications",
      403
    );
  }

  // Get all applications for jobs posted by the company
  const applications = await catchAndWrap(
    () =>
      Application.find({})
        .populate({
          path: "job",
          match: { company: userCompanyId },
          select: "title company companyName location type status createdAt",
        })
        .populate({
          path: "user",
          select: "name email resume avatarUrl phone location",
        })
        .sort({ createdAt: -1 }),
    "Failed to fetch applications"
  );

  // Filter out applications where job is null (not matching company)
  const filteredApplications = applications.filter((app) => app.job !== null);

  res.status(200).json({
    success: true,
    data: filteredApplications,
  });
};

// Send status update email to applicant
export const sendApplicationStatusEmail = async (req, res) => {
  const { applicationId } = req.params;

  // Find application, populate user and job
  const application = await Application.findById(applicationId)
    .populate("user")
    .populate("job");
  if (!application) {
    return res
      .status(404)
      .json({ success: false, message: "Application not found" });
  }
  const user = application.user;
  const job = application.job;
  if (!user?.email) {
    return res
      .status(400)
      .json({ success: false, message: "Applicant email not found" });
  }

  // Email template
  const subject = `Update on your application for ${job.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Application Status Update</h2>
      <p>Dear ${user.name || "Applicant"},</p>
      <p>Your application for the position of <strong>${job.title
    }</strong> at <strong>${job.companyName}</strong> has been updated.</p>
      <p><strong>New Status:</strong> <span style="color: #2563eb;">${application.status.charAt(0).toUpperCase() + application.status.slice(1)
    }</span></p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <br/>
      <p>Best regards,<br/>${job.companyName} Recruitment Team</p>
    </div>
  `;

  await sendCustomEmail(user.email, subject, html);
  res
    .status(200)
    .json({ success: true, message: "Status update email sent to applicant." });
};
