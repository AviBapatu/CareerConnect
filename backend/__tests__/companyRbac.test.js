import request from "supertest";
import app from "../server.js";
import { clearDatabase, authHeaders } from "../test/helpers.js";
import {
  createCandidate,
  createRecruiter,
  createCompany,
  createCompanyAdmin,
  createCompanyRecruiter,
  createCompanyEmployee
} from "../test/factories.js";

describe("Company RBAC (Role-Based Access Control) Tests", () => {
  let company, coAdmin, coRecruiter, coEmployee, outsider;

  beforeEach(async () => {
    await clearDatabase();

    // Create company
    company = await createCompany();

    // Add company members using helper factories
    coAdmin = await createCompanyAdmin(company);
    coRecruiter = await createCompanyRecruiter(company);
    coEmployee = await createCompanyEmployee(company);
    
    // Create an outsider candidate
    outsider = await createCandidate();
  });

  describe("Profile Update Permissions", () => {
    it("should allow Company Admin to update company information", async () => {
      const res = await request(app)
        .put(`/api/company/update/${company._id}`)
        .set(authHeaders(coAdmin))
        .send({
          description: "This is a brand new description of the company"
        });

      expect(res.status).toBe(200);
      expect(res.body.company.description).toBe("This is a brand new description of the company");
    });

    it("should reject Company Recruiter trying to update company information with 403", async () => {
      const res = await request(app)
        .put(`/api/company/update/${company._id}`)
        .set(authHeaders(coRecruiter))
        .send({
          description: "Unauthorized edit"
        });

      expect(res.status).toBe(403);
    });

    it("should reject Company Employee trying to update company information with 403", async () => {
      const res = await request(app)
        .put(`/api/company/update/${company._id}`)
        .set(authHeaders(coEmployee))
        .send({
          description: "Employee edit"
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Join Requests Management", () => {
    let joinRequestUser;

    beforeEach(async () => {
      joinRequestUser = await createCandidate();
      // Add a join request to the company
      company.joinRequests.push({
        user: joinRequestUser._id,
        roleTitle: "employee",
        status: "pending"
      });
      await company.save();
    });

    it("should allow Company Admin to view pending join requests", async () => {
      const res = await request(app)
        .get(`/api/company/${company._id}/requests`)
        .set(authHeaders(coAdmin));

      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBeGreaterThan(0);
    });

    it("should allow Company Recruiter to view pending join requests", async () => {
      const res = await request(app)
        .get(`/api/company/${company._id}/requests`)
        .set(authHeaders(coRecruiter));

      expect(res.status).toBe(200);
    });

    it("should reject Company Employee from viewing join requests with 403", async () => {
      const res = await request(app)
        .get(`/api/company/${company._id}/requests`)
        .set(authHeaders(coEmployee));

      expect(res.status).toBe(403);
    });
  });

  describe("Role Promotion / Assignment", () => {
    let memberToPromote;

    beforeEach(async () => {
      memberToPromote = await createCompanyEmployee(company);
    });

    it("should allow Company Admin to promote an employee to recruiter", async () => {
      const res = await request(app)
        .put(`/api/company/${company._id}/roles/${memberToPromote._id}`)
        .set(authHeaders(coAdmin))
        .send({
          roleTitle: "recruiter"
        });

      expect(res.status).toBe(200);
    });

    it("should prevent Company Recruiter from promoting an employee to admin with 403", async () => {
      const res = await request(app)
        .put(`/api/company/${company._id}/roles/${memberToPromote._id}`)
        .set(authHeaders(coRecruiter))
        .send({
          roleTitle: "admin"
        });

      expect(res.status).toBe(403);
    });
  });
});
