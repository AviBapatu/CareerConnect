import { Router } from "express";
import {
  postJob,
  applyToJob,
  getAllMyApplications,
  getAApplication,
  getAllApplicationForAJob,
  getAllApplicationsForCompany,
  updateJobStatus,
  deleteApplication,
  getJobStatus,
  getJobPosts,
  updateApplicationStatus,
  deleteJobPost,
  editJob,
  getMyJobPosts,
  getJobsByCompany,
  getJobById,
  getAllJobs,
  sendApplicationStatusEmail,
  deleteJobById,
} from "../controllers/job.controller.js";

import { authentication } from "../middleware/auth.js";
import { role } from "../middleware/role.js";
import { checkCompanyRole } from "../middleware/companyRole.js";
import { actionLimiter } from "../middleware/rateLimiter.js";

const router = Router();
router.use(authentication);

router.post(
  "/post",
  authentication,
  role("recruiter", "admin"),
  checkCompanyRole("recruiter", "admin"),
  actionLimiter,
  postJob
); //
router.put(
  "/:id",
  authentication,
  role("recruiter", "admin"),
  checkCompanyRole("recruiter", "admin"),
  actionLimiter,
  editJob
);
router.get("/my-posts", getMyJobPosts);
router.delete("/:id", deleteJobById); // Use new controller for job deletion by id only
router.get("/all", getAllJobs);
router.get("/", getJobsByCompany); // Move this before /:id route
router.get("/:id", getJobById);

router.get(
  "/:companyId/applications/:jobId",
  role("recruiter"),
  checkCompanyRole("recruiter", "admin"),
  getAllApplicationForAJob
); //
router.get(
  "/applications/company",
  role("recruiter"),
  checkCompanyRole("recruiter", "admin"),
  getAllApplicationsForCompany
); //
router.put(
  "/:companyId/:jobId/status",
  role("recruiter"),
  checkCompanyRole("recruiter", "admin"),
  updateJobStatus
); //
router.delete("/:jobId/application/delete/:applicationId", deleteApplication); //
router.put(
  "/:companyId/applications/:applicationId/status",
  role("recruiter"),
  checkCompanyRole("recruiter", "admin"),
  updateApplicationStatus
); //
router.delete("/:companyId/delete/:jobId/", deleteJobPost); //
router.post(
  "/:applicationId/send-status-email",
  role("recruiter"),
  checkCompanyRole("recruiter", "admin"),
  actionLimiter,
  sendApplicationStatusEmail
);

router.get("/posts", getJobPosts); //
router.get("/status/:jobId", getJobStatus); //
router.post("/apply/:jobId", actionLimiter, applyToJob); //

router.get("/my/applications", getAllMyApplications); //
router.get("/my/applications/:jobId", getAApplication); //

export default router;
