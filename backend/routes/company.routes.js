import express from "express";
import { authentication } from "../middleware/auth.js";
import { checkCompanyRole } from "../middleware/companyRole.js";
import { role } from "../middleware/role.js";
import Company from "../models/Company.js";
import {
  getAllCompanies,
  getFilterOptions,
  createCompany,
  updateCompany,
  deleteCompany,
  requestToJoinCompany,
  getJoinRequests,
  handleJoinRequest,
  updateCompanyRole,
  removeMemberFromCompany,
  getCompanyMembers,
  uploadCompanyLogo,
  uploadCompanyCover,
  getMyCompany,
  getMyCompanyRole,
  searchCompaniesByName,
  getCompanyById,
  getMyJoinRequestStatus,
  respondToCompanyJoinRequest,
  inviteUserToCompany,
} from "../controllers/company.controller.js";
import { logoUpload, coverUpload } from "../middleware/multer.js";
import { actionLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public: Get newest companies

router.use(authentication);
// Only admin can upload logo
router.patch(
  "/:companyId/logo",
  checkCompanyRole("admin"),
  logoUpload.single("logo"),
  uploadCompanyLogo
);

// Only admin can upload cover image
router.patch(
  "/:companyId/cover",
  checkCompanyRole("admin"),
  coverUpload.single("coverImage"),
  uploadCompanyCover
);
router.use(express.json());

router.get("/all", getAllCompanies);
router.get("/filter-options", getFilterOptions);
router.get("/search", searchCompaniesByName);
router.get("/my/:companyId", getCompanyById);
router.get("/:id/me-role", getMyCompanyRole);

router.post("/create", role("recruiter"), actionLimiter, createCompany);

router.put("/update/:companyId", checkCompanyRole("admin"), updateCompany);
router.delete("/delete/:companyId", checkCompanyRole("admin"), deleteCompany);

router.post("/:companyId/request", actionLimiter, requestToJoinCompany);
router.get(
  "/:companyId/requests",
  checkCompanyRole("admin", "recruiter"),
  getJoinRequests
);
router.put(
  "/:companyId/requests/respond",
  authentication,
  respondToCompanyJoinRequest
);
router.put(
  "/:companyId/requests/:requestId",
  checkCompanyRole("admin", "recruiter"),
  handleJoinRequest
);

router.put(
  "/:companyId/roles/:userId",
  checkCompanyRole("admin", "recruiter"),
  updateCompanyRole
);
router.delete(
  "/:companyId/roles/:userId",
  checkCompanyRole("admin", "recruiter"),
  removeMemberFromCompany
);

router.post(
  "/:companyId/invite",
  checkCompanyRole("admin", "recruiter"),
  actionLimiter,
  inviteUserToCompany
);

router.get(
  "/:companyId/members",
  checkCompanyRole("admin", "recruiter"),
  getCompanyMembers
);

router.get("/my-company", role("recruiter"), getMyCompany);
router.get("/my-company-role", role("recruiter"), getMyCompanyRole);
router.get("/my-join-requests", authentication, getMyJoinRequestStatus);

export default router;
