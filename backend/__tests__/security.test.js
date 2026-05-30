import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js";
import { clearDatabase, authHeaders } from "../test/helpers.js";
import { createCandidate } from "../test/factories.js";

describe("Validation and Security Integration Tests", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Zod Validation Tests", () => {
    it("should return 400 for invalid email structure on registration", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "invalid-email-format",
          password: "Password123!",
          role: "candidate"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for password that is too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "123",
          role: "candidate"
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing required fields during company creation", async () => {
      const recruiter = await createCandidate({ role: "recruiter" });

      const res = await request(app)
        .post("/api/company/create")
        .set(authHeaders(recruiter))
        .send({
          // missing 'name' and 'industry'
          size: "1-10"
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid Mongo ObjectId params", async () => {
      const user = await createCandidate();

      const res = await request(app)
        .get("/api/company/my/invalid-object-id")
        .set(authHeaders(user));

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid role value in user registration", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
          role: "superadmin" // invalid role
        });

      expect(res.status).toBe(400);
    });
  });

  describe("Route Protection & JWT Security", () => {
    it("should block unauthenticated request with 401", async () => {
      const res = await request(app)
        .get("/api/job/my-posts");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    it("should block invalid JWT token with 401", async () => {
      const res = await request(app)
        .get("/api/job/my-posts")
        .set("Authorization", "Bearer invalid-jwt-value");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid token");
    });

    it("should block expired JWT token with 401", async () => {
      const expiredToken = jwt.sign(
        { id: "some-user-id" },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "-10s" } // expired 10s ago
      );

      const res = await request(app)
        .get("/api/job/my-posts")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid token");
    });

    it("should block tampered JWT token signature with 401", async () => {
      const validToken = jwt.sign(
        { id: "some-user-id" },
        "different-secret-key-signature",
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/job/my-posts")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid token");
    });
  });
});
