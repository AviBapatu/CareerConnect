import request from "supertest";
import app from "../server.js";
import { clearDatabase, authHeaders } from "../test/helpers.js";
import {
  createCandidate,
  createRecruiter,
  createAdmin,
  createCompany,
  createCompanyAdmin,
  createCompanyRecruiter,
  createJob,
  createApplication
} from "../test/factories.js";

describe("Application RBAC (Role-Based Access Control) Tests", () => {
  let candidate, recruiter, admin, company, job;

  beforeEach(async () => {
    await clearDatabase();
    
    // Set up standard entities
    company = await createCompany();
    recruiter = await createCompanyRecruiter(company);
    candidate = await createCandidate();
    admin = await createAdmin();
    job = await createJob(company, recruiter);
  });

  describe("Candidate Permissions", () => {
    it("should reject candidate trying to post a job with 403", async () => {
      const res = await request(app)
        .post("/api/job/post")
        .set(authHeaders(candidate))
        .send({
          title: "Intern software developer",
          description: "Develop cool features",
          requirements: ["NodeJS"],
          companyId: company._id,
          location: "Remote",
          type: "full-time"
        });

      expect(res.status).toBe(403);
    });

    it("should reject candidate trying to edit a job with 403", async () => {
      const res = await request(app)
        .put(`/api/job/${job._id}`)
        .set(authHeaders(candidate))
        .send({
          title: "New Job Title"
        });

      expect(res.status).toBe(403);
    });

    it("should reject candidate trying to view applications for a company", async () => {
      const res = await request(app)
        .get("/api/job/applications/company")
        .set(authHeaders(candidate));

      expect(res.status).toBe(403);
    });
  });

  describe("Recruiter Permissions", () => {
    it("should allow recruiter to create a job under their company", async () => {
      const res = await request(app)
        .post("/api/job/post")
        .set(authHeaders(recruiter))
        .send({
          title: "Senior Backend Engineer",
          description: "Write integration tests",
          requirements: ["Jest", "Supertest"],
          location: "New York",
          type: "full-time"
        });

      expect(res.status).toBe(201);
      expect(res.body.job).toHaveProperty("title", "Senior Backend Engineer");
    });

    it("should allow recruiter to edit their own job post", async () => {
      const res = await request(app)
        .put(`/api/job/${job._id}`)
        .set(authHeaders(recruiter))
        .send({
          title: "Updated Job Title",
          description: job.description,
          location: job.location,
          type: job.type
        });

      expect(res.status).toBe(200);
      expect(res.body.job).toHaveProperty("title", "Updated Job Title");
    });
  });

  describe("Admin Privileges", () => {
    it("should allow global admin to perform recruiter-level actions (e.g. create/edit jobs)", async () => {
      // 1. Create company and add admin to company first to satisfy checkCompanyRole
      const adminCompany = await createCompany();
      const companyAdminUser = await createCompanyAdmin(adminCompany, { role: "admin" });

      const res = await request(app)
        .post("/api/job/post")
        .set(authHeaders(companyAdminUser))
        .send({
          title: "Staff Developer",
          description: "Tech lead responsibilities",
          requirements: ["System design"],
          location: "SF",
          type: "full-time"
        });

      expect(res.status).toBe(201);
    });
  });
});
