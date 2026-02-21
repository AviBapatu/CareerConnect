import { cloudinary } from "../config/cloudinary.js";
import { buildCompanyQuery } from "../utils/queryOperations/companyOptions.js";
import User from "../models/User.js";
import {
  createCompanySchema,
  updateCompanySchema,
  requestToJoinSchema,
  handleJoinRequestSchema,
  updateCompanyRoleSchema,
  getMyCompanyRoleSchema,
} from "../zodSchema/company.validation.js";
import { AppError } from "../utils/AppError.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import mongoose from "mongoose";
import Company from "../models/Company.js";

export const getMyCompany = async (req, res, next) => {
  const user = req.user;
  if (!user.company) {
    return res.json({});
  }
  const company = await catchAndWrap(
    () => Company.findById(user.company),
    "Failed to fetch company"
  );
  if (!company) {
    return res.json({});
  }
  res.json(company);
};

export const searchCompaniesByName = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    throw new AppError("Query too short", 400);
  }

  const results = await catchAndWrap(
    () =>
      Company.find({ name: new RegExp(q, "i") })
        .select("_id name logo")
        .limit(10)
        .lean(),
    "Company search failed"
  );

  res.json(results);
};

export const getMyCompanyRole = async (req, res) => {
  const parsed = getMyCompanyRoleSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError("Validation falied", 400, parsed.error.errors);
  }
  const { id: companyId } = parsed.data;
  const userId = req.user._id;

  const company = await catchAndWrap(
    () => Company.findById(companyId),
    "Failed to fetch company"
  );

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Defensive: ensure members array exists
  if (!Array.isArray(company.members)) {
    return res.status(404).json({ message: "Company members not found" });
  }

  const member = company.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (member) {
    return res.status(200).json({ role: member.role });
  }

  // Check if user has a pending join request
  const pendingRequest = company.joinRequests.find(
    (r) => r.user.toString() === userId.toString() && r.status === "pending"
  );

  if (pendingRequest) {
    return res.status(200).json({
      role: "pending",
      message: "You have a pending join request for this company"
    });
  }

  // Check if user has an accepted join request but not yet added to members
  const acceptedRequest = company.joinRequests.find(
    (r) => r.user.toString() === userId.toString() && r.status === "accepted"
  );

  if (acceptedRequest) {
    return res.status(200).json({ role: acceptedRequest.roleTitle });
  }

  throw new AppError("You are not a member of this company", 403);
};

export const createCompany = async (req, res) => {
  // req.log.info("REQ BODY", req.body);
  // req.log.info("REQ HEADERS", req.headers);
  // req.log.info("REQ FILES", req.files);

  // Parse socialLinks if sent as FormData fields
  let parsedBody = { ...req.body };
  if (
    parsedBody["socialLinks[linkedin]"] ||
    parsedBody["socialLinks[twitter]"] ||
    parsedBody["socialLinks[github]"]
  ) {
    parsedBody.socialLinks = {
      linkedin: parsedBody["socialLinks[linkedin]"] || "",
      twitter: parsedBody["socialLinks[twitter]"] || "",
      github: parsedBody["socialLinks[github]"] || "",
    };
  }

  const parsedData = createCompanySchema.parse(parsedBody);
  const userId = req.user._id;

  const existingCompany = await Company.findOne({ name: parsedData.name });
  if (existingCompany) {
    throw new AppError("Company name already exists", 400);
  }

  const company = await catchAndWrap(async () => {
    return await Company.create({
      ...parsedData,
      admins: [userId],
      members: [{ user: userId, role: "admin" }],
    });
  }, "Failed to create company");

  await catchAndWrap(async () => {
    await User.findByIdAndUpdate(userId, {
      company: company._id,
      companyRole: "admin",
    });
  }, "Failed to update user with company info");

  res.status(201).json({
    success: true,
    message: "Company created successfully",
    company,
  });
};

export const uploadCompanyLogo = async (req, res) => {
  req.log.info("REQ BODY upload company logo", req.body);
  req.log.info("REQ HEADERS upload company logo", req.headers);
  req.log.info("REQ FILES upload company logo", req.files);
  const { companyId } = req.params;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });
  if (company.logoPublicId) {
    await cloudinary.uploader.destroy(company.logoPublicId);
  }
  req.log.info("UPLOAD LOGO FILE", req.file);
  company.logo = req.file.path;
  company.logoPublicId = req.file.public_id;
  await company.save();
  res.json({ success: true, logo: company.logo });
};

// Upload company cover image
export const uploadCompanyCover = async (req, res) => {
  const { companyId } = req.params;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ error: "Company not found" });
  if (company.coverImagePublicId) {
    await cloudinary.uploader.destroy(company.coverImagePublicId);
  }
  req.log.info("UPLOAD COVER FILE", req.file);
  company.coverImage = req.file.path;
  company.coverImagePublicId = req.file.public_id;
  await company.save();
  res.json({ success: true, coverImage: company.coverImage });
};

export const getAllCompanies = async (req, res) => {
  const {
    search,
    industry,
    location,
    size,
    sort = "name",
    page = 1,
    limit = 12,
    hasJobs,
  } = req.query;

  // Build filter object
  const filter = buildCompanyQuery({
    industry,
    location,
    size,
    verified: req.query.verified,
    foundedAfter: req.query.foundedAfter,
    foundedBefore: req.query.foundedBefore,
  });

  // Add search functionality
  if (search && search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { industry: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  // Build sort object
  let sortObject = {};
  switch (sort) {
    case "name_asc":
      sortObject = { name: 1 };
      break;
    case "name_desc":
      sortObject = { name: -1 };
      break;
    case "newest":
      sortObject = { createdAt: -1 };
      break;
    case "oldest":
      sortObject = { createdAt: 1 };
      break;
    case "most_jobs":
      sortObject = { jobCount: -1 };
      break;
    default:
      sortObject = { name: 1 };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Aggregate pipeline to get job counts and filter by jobs if needed
    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "company",
          as: "jobs",
        },
      },
      {
        $addFields: {
          jobCount: { $size: "$jobs" },
        },
      },
      {
        $project: {
          name: 1,
          industry: 1,
          location: 1,
          size: 1,
          logo: 1,
          description: 1,
          website: 1,
          jobCount: 1,
          verified: 1,
          createdAt: 1,
        },
      },
    ];

    // Add filter for companies with jobs if requested
    if (hasJobs === "true") {
      aggregationPipeline.push({ $match: { jobCount: { $gt: 0 } } });
    }

    // Add sorting
    aggregationPipeline.push({ $sort: sortObject });

    // Get total count
    const totalCountPipeline = [...aggregationPipeline, { $count: "total" }];
    const [totalResult] = await Company.aggregate(totalCountPipeline);
    const total = totalResult?.total || 0;

    // Add pagination
    aggregationPipeline.push({ $skip: skip }, { $limit: limitNum });

    // Execute query with case-insensitive collation for correct sorting
    const companies = await Company.aggregate(aggregationPipeline).collation({
      locale: "en",
      strength: 2,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      companies,
      pagination: {
        current: pageNum,
        total: totalPages,
        limit: limitNum,
        totalCompanies: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    req.log.error("Error fetching companies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    // Get distinct industries
    const industries = await Company.distinct("industry");

    // Get distinct locations
    const locations = await Company.distinct("location");

    // Predefined size options
    const sizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

    res.status(200).json({
      success: true,
      options: {
        industries: industries.filter(
          (industry) => industry && industry.trim()
        ),
        locations: locations.filter((location) => location && location.trim()),
        sizes,
      },
    });
  } catch (error) {
    req.log.error("Error fetching filter options:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
    });
  }
};

export const getCompanyById = async (req, res) => {
  const { companyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new AppError("Invalid company ID", 400);
  }

  const company = await catchAndWrap(
    () =>
      Company.findById(companyId)
        .populate("admins", "name email")
        .populate("members.user", "name email"),
    "Failed to fetch company",
    500
  );

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Optional: Strip sensitive fields or reshape if needed
  const companyData = {
    _id: company._id,
    name: company.name,
    industry: company.industry,
    size: company.size,
    location: company.location,
    website: company.website,
    foundedYear: company.foundedYear,
    description: company.description,
    logo: company.logo,
    logoPublicId: company.logoPublicId,
    coverImage: company.coverImage,
    coverImagePublicId: company.coverImagePublicId,
    socialLinks: company.socialLinks || {
      linkedin: "",
      twitter: "",
      github: "",
    },
    admins: company.admins,
    members: company.members,
  };

  res.status(200).json({
    success: true,
    company: companyData,
  });
};

export const updateCompany = async (req, res) => {
  const { companyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new AppError("Invalid company ID", 400);
  }

  const parsed = updateCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const updatedCompany = await catchAndWrap(
    () =>
      Company.findByIdAndUpdate(companyId, parsed.data, {
        new: true,
        runValidators: true,
      }),
    "Failed to update company",
    500
  );

  if (!updatedCompany) {
    throw new AppError("Company not found", 404);
  }

  res.status(200).json({
    success: true,
    company: updatedCompany,
  });
};

export const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new AppError("Invalid company ID", 400);
  }

  const deleted = await catchAndWrap(
    () => Company.findByIdAndDelete(companyId),
    "Failed to delete company",
    500
  );

  if (!deleted) {
    throw new AppError("Company not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Company deleted successfully",
  });
};

export const requestToJoinCompany = async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user._id;

  const parsed = requestToJoinSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { roleTitle } = parsed.data;

  const company = await catchAndWrap(
    () => Company.findById(companyId),
    "Failed to fetch company",
    404
  );
  if (!company) throw new AppError("Company not found", 404);

  const existingRequest = company.joinRequests.find(
    (r) => r.user.toString() === userId.toString()
  );

  const alreadyMember =
    company.admins.includes(userId) ||
    (existingRequest && existingRequest.status === "accepted");

  if (alreadyMember) {
    throw new AppError("You're already part of this company", 400);
  }

  if (existingRequest && existingRequest.status === "pending") {
    throw new AppError("You already requested to join this company", 400);
  }

  // Add join request to company
  company.joinRequests.push({
    user: userId,
    roleTitle,
    status: "pending",
  });

  // Add join request to user
  await User.findByIdAndUpdate(userId, {
    $push: {
      companyJoinRequests: {
        company: companyId,
        roleTitle,
        status: "pending",
      },
    },
  });

  await catchAndWrap(() => company.save(), "Failed to submit join request");

  res.status(200).json({
    success: true,
    message: "Join request submitted successfully",
  });
};

export const getJoinRequests = async (req, res) => {
  const { companyId } = req.params;

  const company = await catchAndWrap(
    async () =>
      await Company.findById(companyId)
        .populate("joinRequests.user", "name email")
        .lean(),
    "Failed to fetch company or requests",
    404
  );

  if (!company) throw new AppError("Company not found", 404);

  res.status(200).json({
    success: true,
    requests: company.joinRequests || [],
  });
};

// Accept or reject join request
export const handleJoinRequest = async (req, res) => {
  const { companyId, requestId } = req.params;
  const { status } = req.body; // "accepted" or "rejected"

  if (!["accepted", "rejected"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const company = await Company.findById(companyId).populate(
    "joinRequests.user"
  );
  if (!company) throw new AppError("Company not found", 404);

  const request = company.joinRequests.id(requestId);
  if (!request) throw new AppError("Join request not found", 404);

  if (request.status !== "pending") {
    throw new AppError("Request already handled", 400);
  }

  request.status = status;
  await company.save();

  // Update user's companyJoinRequests status
  await User.updateOne(
    { _id: request.user._id, "companyJoinRequests.company": companyId },
    { $set: { "companyJoinRequests.$.status": status } }
  );

  if (status === "accepted") {
    // Add user to company members
    company.members.push({ user: request.user._id, role: request.roleTitle });
    if (request.roleTitle === "admin") {
      company.admins.push(request.user._id);
    }
    await company.save();

    // Update user's company and companyRole
    const userUpdate = {
      company: company._id,
      companyRole: request.roleTitle,
    };
    // If the user is joining as recruiter or admin, update global role to recruiter
    if (["recruiter", "admin"].includes(request.roleTitle)) {
      userUpdate.role = "recruiter";
    }
    await User.findByIdAndUpdate(request.user._id, userUpdate);
  }

  res.status(200).json({ success: true, message: `Request ${status}` });
};
export const updateCompanyRole = async (req, res) => {
  const { companyId, userId } = req.params;
  const { roleTitle } = updateCompanyRoleSchema.parse(req.body);

  // Don't allow promoting to admin unless you're already admin
  if (roleTitle === "admin" && req.companyRole !== "admin") {
    throw new AppError("Only an admin can assign admin role", 403);
  }

  const company = await catchAndWrap(
    () => Company.findById(companyId),
    "Failed to find company"
  );
  if (!company) throw new AppError("Company not found", 404);

  const joinRequest = company.joinRequests.find(
    (req) => req.user.toString() === userId && req.status === "accepted"
  );

  if (!joinRequest) {
    throw new AppError("User is not a valid company member", 404);
  }

  // Update the company role in joinRequests
  joinRequest.roleTitle = roleTitle;

  // Also update the member's role in the members array
  const memberIndex = company.members.findIndex(
    (member) => member.user.toString() === userId
  );
  if (memberIndex !== -1) {
    company.members[memberIndex].role = roleTitle;
  }

  await catchAndWrap(() => company.save(), "Failed to update user role");

  // Update the user's companyRole field
  const user = await User.findById(userId);
  if (user) {
    user.companyRole = roleTitle;
    // Update user role if needed (recruiter/admin should have role=recruiter)
    if (roleTitle === "recruiter" || roleTitle === "admin") {
      user.role = "recruiter";
    } else if (roleTitle === "employee") {
      user.role = "candidate";
    }
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `Updated role to '${roleTitle}'`,
  });
};

export const removeMemberFromCompany = async (req, res) => {
  const { companyId, userId } = req.params;

  if (req.user._id.toString() === userId) {
    throw new AppError("You cannot remove yourself", 400);
  }

  const company = await catchAndWrap(
    () => Company.findById(companyId),
    "Failed to find company"
  );
  if (!company) throw new AppError("Company not found", 404);

  const requestIndex = company.joinRequests.findIndex(
    (r) => r.user.toString() === userId && r.status === "accepted"
  );
  if (requestIndex === -1) {
    throw new AppError("User is not a member of the company", 404);
  }

  const userRequest = company.joinRequests[requestIndex];

  // Only admin can remove admin users
  if (userRequest.roleTitle === "admin" && req.companyRole !== "admin") {
    throw new AppError("Only an admin can remove another admin", 403);
  }

  // Remove from joinRequests
  company.joinRequests.splice(requestIndex, 1);

  // Remove from admins array
  company.admins = company.admins.filter(
    (adminId) => adminId.toString() !== userId
  );

  // Remove from members array
  company.members = company.members.filter(
    (member) => member.user.toString() !== userId
  );

  await catchAndWrap(() => company.save(), "Failed to update company");

  // Update user's company fields
  const user = await User.findById(userId);
  if (user && user.company?.toString() === companyId) {
    user.company = null;
    user.companyRole = null;
    // Reset role to candidate if they were a recruiter or employee
    if (user.role === "recruiter" || user.role === "employee") {
      user.role = "candidate";
    }
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
};

export const getMyJoinRequestStatus = async (req, res) => {
  const userId = req.user._id;

  try {
    // Find companies where user has join requests
    const companies = await Company.find({
      "joinRequests.user": userId,
    }).select("name joinRequests").lean();

    req.log.info("🔍 Found companies for user:", companies.map(c => ({ id: c._id, name: c.name })));

    const userRequests = [];

    companies.forEach((company) => {
      const userRequest = company.joinRequests.find(
        (request) => request.user.toString() === userId.toString()
      );

      if (userRequest) {
        req.log.info("🔍 Processing request for company:", {
          companyId: company._id,
          companyName: company.name,
          hasName: !!company.name,
          nameType: typeof company.name
        });

        if (!company.name) {
          req.log.error("❌ Company name is missing for company:", company._id);
        }

        userRequests.push({
          _id: userRequest._id,
          company: {
            _id: company._id,
            name: company.name,
          },
          roleTitle: userRequest.roleTitle,
          status: userRequest.status,
          requestedAt: userRequest.requestedAt,
        });
      }
    });

    req.log.info("🔍 Final user requests:", userRequests);

    res.status(200).json({
      success: true,
      requests: userRequests,
    });
  } catch (error) {
    req.log.error("Error in getMyJoinRequestStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch join request status",
    });
  }
};

export const getCompanyMembers = async (req, res) => {
  const { companyId } = req.params;

  const company = await catchAndWrap(
    () =>
      Company.findById(companyId).populate("joinRequests.user", "name email"),
    "Failed to fetch company"
  );

  if (!company) throw new AppError("Company not found", 404);

  // Get all accepted members from joinRequests
  const acceptedMembers = company.joinRequests
    .filter((request) => request.status === "accepted")
    .map((request) => ({
      _id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      role: request.roleTitle, // This is the company role
    }));

  res.status(200).json({
    success: true,
    count: acceptedMembers.length,
    members: acceptedMembers,
  });
};

// User responds to company join request (accept/reject)
export const respondToCompanyJoinRequest = async (req, res) => {
  const userId = req.user._id;
  const { companyId } = req.params;
  const { status } = req.body; // "accepted" or "rejected"

  req.log.info("🔍 respondToCompanyJoinRequest called with:", {
    userId: userId.toString(),
    companyId,
    status,
    userRole: req.user.role
  });

  if (!["accepted", "rejected"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  // Update user's join request status
  req.log.info("🔍 Updating user's join request status...");

  // First, let's check what join requests the user currently has
  const userBefore = await User.findById(userId);
  req.log.info("🔍 User's current join requests:", userBefore?.companyJoinRequests || []);

  const user = await User.findOneAndUpdate(
    { _id: userId, "companyJoinRequests.company": companyId },
    { $set: { "companyJoinRequests.$.status": status } },
    { new: true }
  ).populate("companyJoinRequests.company");

  if (!user) {
    req.log.info("❌ User not found or join request not found");
    throw new AppError("Join request not found", 404);
  }

  req.log.info("✅ User updated successfully:", user._id);
  req.log.info("🔍 User's updated join requests:", user.companyJoinRequests || []);

  // Update company joinRequests status
  req.log.info("🔍 Updating company join request status...");
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  req.log.info("🔍 Company found:", company.name);
  req.log.info("🔍 Looking for user's pending request...");

  const reqObj = company.joinRequests.find(
    (r) => r.user.toString() === userId.toString() && r.status === "pending"
  );

  if (!reqObj) {
    req.log.info("❌ Join request not found in company for user:", userId.toString());
    req.log.info("🔍 Available requests:", company.joinRequests.map(r => ({
      user: r.user.toString(),
      status: r.status,
      roleTitle: r.roleTitle
    })));
    throw new AppError("Join request not found in company", 404);
  }

  req.log.info("✅ Found pending request:", reqObj.roleTitle);
  reqObj.status = status;
  await company.save();
  req.log.info("✅ Company updated successfully");

  if (status === "accepted") {
    req.log.info("🔍 Adding user to company members...");
    // Add user to company members
    company.members.push({ user: userId, role: reqObj.roleTitle });
    if (reqObj.roleTitle === "admin") {
      company.admins.push(userId);
    }
    await company.save();
    req.log.info("✅ User added to company members");

    // Update user's company and companyRole
    req.log.info("🔍 Updating user's company and role...");
    user.company = company._id;
    user.companyRole = reqObj.roleTitle;
    await user.save();
    req.log.info("✅ User's company and role updated");
  }

  res.status(200).json({ success: true, message: `Request ${status}` });
};

// Invite a user to join the company (admin/recruiter action)
export const inviteUserToCompany = async (req, res) => {
  const { companyId } = req.params;
  const { userId, roleTitle } = req.body;

  if (!userId || !roleTitle) {
    throw new AppError("User ID and roleTitle are required", 400);
  }

  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);

  // Check if user is already a member or has a pending/accepted request
  const alreadyMember = company.members.some(
    (m) => m.user.toString() === userId
  );
  const existingRequest = company.joinRequests.find(
    (r) =>
      r.user.toString() === userId && ["pending", "accepted"].includes(r.status)
  );
  if (
    alreadyMember ||
    (existingRequest && existingRequest.status === "accepted")
  ) {
    throw new AppError("User is already part of this company", 400);
  }
  if (existingRequest && existingRequest.status === "pending") {
    throw new AppError(
      "A pending join request already exists for this user",
      400
    );
  }

  // Add join request to company
  company.joinRequests.push({
    user: userId,
    roleTitle,
    status: "pending",
  });
  await company.save();

  // Add join request to user
  await User.findByIdAndUpdate(userId, {
    $push: {
      companyJoinRequests: {
        company: companyId,
        roleTitle,
        status: "pending",
      },
    },
  });

  res.status(200).json({ success: true, message: "Join request sent to user" });
};
