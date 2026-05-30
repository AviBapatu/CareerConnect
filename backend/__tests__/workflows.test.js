import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Article from "../models/Article.js";
import Connection from "../models/Connection.js";
import { clearDatabase, authHeaders } from "../test/helpers.js";
import {
  createCandidate,
  createRecruiter,
  createAdmin,
  createCompany,
  createCompanyAdmin,
  createCompanyRecruiter,
  createCompanyEmployee,
  createJob,
  createArticle,
  createConnectionRequest,
  createApplication
} from "../test/factories.js";

describe("Workflows Integration Tests", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Job Application Workflow", () => {
    it("should successfully run the full job workflow", async () => {
      // 1. Recruiter creates job
      const company = await createCompany();
      const recruiter = await createCompanyRecruiter(company);
      
      const jobRes = await request(app)
        .post("/api/job/post")
        .set(authHeaders(recruiter))
        .send({
          title: "Full Stack Engineer",
          description: "Write backend tests and clean frontend code.",
          requirements: ["Node.js", "Express", "React"],
          location: "Remote",
          type: "full-time"
        });

      expect(jobRes.status).toBe(201);
      const jobId = jobRes.body.job._id;

      // 2. Candidate views jobs
      const candidate = await createCandidate({ resumeUrl: "https://example.com/resume.pdf" });
      const viewRes = await request(app)
        .get(`/api/job/${jobId}`)
        .set(authHeaders(candidate));

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.title).toBe("Full Stack Engineer");

      // 3. Candidate applies
      const applyRes = await request(app)
        .post(`/api/job/apply/${jobId}`)
        .set(authHeaders(candidate))
        .send({
          resume: "https://example.com/test-resume.pdf",
          coverLetter: "I love backend testing!"
        });

      expect(applyRes.status).toBe(201);
      const applicationId = applyRes.body.data._id;

      // 4. Recruiter views application
      const appRes = await request(app)
        .get(`/api/job/${company._id}/applications/${jobId}`)
        .set(authHeaders(recruiter));

      expect(appRes.status).toBe(200);
      expect(appRes.body.data.length).toBeGreaterThan(0);

      // 5. Recruiter updates application status
      const statusRes = await request(app)
        .put(`/api/job/${company._id}/applications/${applicationId}/status`)
        .set(authHeaders(recruiter))
        .send({
          status: "interview"
        });

      expect(statusRes.status).toBe(200);

      // Verify db state
      const dbApp = await Application.findById(applicationId);
      expect(dbApp.status).toBe("interview");
    });

    it("should reject candidate trying to modify application status with 403", async () => {
      const company = await createCompany();
      const recruiter = await createCompanyRecruiter(company);
      const candidate = await createCandidate();
      const job = await createJob(company, recruiter);
      const application = await createApplication(job._id, candidate._id);

      const res = await request(app)
        .put(`/api/job/${company._id}/applications/${application._id}/status`)
        .set(authHeaders(candidate))
        .send({
          status: "hired"
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Company Joining & Administration Workflow", () => {
    it("should run the full company join request lifecycle", async () => {
      const company = await createCompany();
      const admin = await createCompanyAdmin(company);
      const user = await createRecruiter(); // Recruiter wanting to join

      // 1. User requests to join company
      const reqRes = await request(app)
        .post(`/api/company/${company._id}/request`)
        .set(authHeaders(user))
        .send({
          roleTitle: "recruiter"
        });

      expect(reqRes.status).toBe(200);
      
      const dbCompanyAfterReq = await Company.findById(company._id);
      expect(dbCompanyAfterReq.joinRequests.length).toBe(1);
      expect(dbCompanyAfterReq.joinRequests[0].status).toBe("pending");

      const requestId = dbCompanyAfterReq.joinRequests[0]._id;

      // 2. Admin approves request
      const approveRes = await request(app)
        .put(`/api/company/${company._id}/requests/${requestId}`)
        .set(authHeaders(admin))
        .send({
          status: "accepted"
        });

      expect(approveRes.status).toBe(200);

      const dbCompanyAfterApprove = await Company.findById(company._id);
      expect(dbCompanyAfterApprove.joinRequests[0].status).toBe("accepted");
      expect(dbCompanyAfterApprove.members.some(m => m.user.toString() === user._id.toString())).toBe(true);

      const dbUser = await User.findById(user._id);
      expect(dbUser.company.toString()).toBe(company._id.toString());
      expect(dbUser.companyRole).toBe("recruiter");
    });
  });

  describe("Article Authorizations", () => {
    it("should allow author to create/update article, prevent other users, and allow admin to moderate", async () => {
      const userA = await createCandidate();
      const userB = await createCandidate();
      const admin = await createAdmin();

      // 1. Create article
      const article = await createArticle(userA._id, "User");

      // 2. User A updates article -> success
      const updateRes = await request(app)
        .patch(`/api/article/${article._id}`)
        .set(authHeaders(userA))
        .send({
          title: "Successfully Updated Title"
        });

      expect(updateRes.status).toBe(200);

      // 3. User B updates article -> 404/403 (unauthorized)
      const updateOtherRes = await request(app)
        .patch(`/api/article/${article._id}`)
        .set(authHeaders(userB))
        .send({
          title: "Hacked Title"
        });

      expect(updateOtherRes.status).toBe(404);

      // 4. User B deletes article -> 404/403 (unauthorized)
      const deleteOtherRes = await request(app)
        .delete(`/api/article/${article._id}`)
        .set(authHeaders(userB));

      expect(deleteOtherRes.status).toBe(404);

      // 5. Admin deletes article -> 200 (moderation success)
      const deleteAdminRes = await request(app)
        .delete(`/api/article/${article._id}`)
        .set(authHeaders(admin));

      expect(deleteAdminRes.status).toBe(200);

      const dbArticle = await Article.findById(article._id);
      expect(dbArticle).toBeNull();
    });
  });

  describe("Connection Requests", () => {
    it("should send, accept, and reject connection requests and enforce validations", async () => {
      const userA = await createCandidate();
      const userB = await createCandidate();

      // 1. Send request
      const reqRes = await request(app)
        .post("/api/connection/request")
        .set(authHeaders(userA))
        .send({
          recipientId: userB._id.toString()
        });

      expect(reqRes.status).toBe(201);
      const reqId = reqRes.body._id;

      // 2. Prevent duplicate request
      const dupRes = await request(app)
        .post("/api/connection/request")
        .set(authHeaders(userA))
        .send({
          recipientId: userB._id.toString()
        });

      expect(dupRes.status).toBe(400);

      // 3. Prevent self-request
      const selfRes = await request(app)
        .post("/api/connection/request")
        .set(authHeaders(userA))
        .send({
          recipientId: userA._id.toString()
        });

      expect(selfRes.status).toBe(400);

      // 4. Accept connection request
      const acceptRes = await request(app)
        .patch("/api/connection/accept")
        .set(authHeaders(userB))
        .send({
          requester: userA._id.toString()
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.status).toBe("accepted");

      // Verify connection in DB
      const dbConn = await Connection.findById(reqId);
      expect(dbConn.status).toBe("accepted");
    });
  });
});
