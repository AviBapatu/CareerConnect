import request from "supertest";
import crypto from "crypto";
import app from "../server.js";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import Otp from "../models/Otp.js";
import RefreshToken from "../models/RefreshToken.js";
import { clearDatabase } from "../test/helpers.js";
import { PASSWORD, createCandidate } from "../test/factories.js";

describe("Authentication Integration Tests", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Registration Flow", () => {
    it("should successfully register a candidate and send an OTP", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test Candidate",
          email: "candidate@example.com",
          password: "Password123!",
          role: "candidate"
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("twoFactorRequired", true);
      expect(res.body).toHaveProperty("userId");

      const pendingUser = await PendingUser.findOne({ email: "candidate@example.com" });
      expect(pendingUser).not.toBeNull();
      expect(pendingUser.role).toBe("candidate");
    });

    it("should reject duplicate email registration", async () => {
      await createCandidate({ email: "candidate@example.com" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Duplicate Candidate",
          email: "candidate@example.com",
          password: "Password123!",
          role: "candidate"
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("User already exists");
    });

    it("should reject registration with invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Invalid Email Candidate",
          email: "not-an-email",
          password: "Password123!",
          role: "candidate"
        });

      expect(res.status).toBe(400);
    });

    it("should reject registration with missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Missing Fields",
          role: "candidate"
        });

      expect(res.status).toBe(400);
    });

    it("should reject registration with invalid password (too short)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Bad Password",
          email: "badpass@example.com",
          password: "123",
          role: "candidate"
        });

      expect(res.status).toBe(400);
    });
  });

  describe("OTP Verification Flow", () => {
    it("should successfully verify signup with a valid OTP", async () => {
      // 1. Create a pending user
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "OTP Candidate",
          email: "otp@example.com",
          password: "Password123!",
          role: "candidate"
        });

      const userId = registerRes.body.userId;
      const pending = await PendingUser.findById(userId);
      
      // 2. Manipulate/force a known OTP secret in the database
      const testOtp = "123456";
      pending.twoFactorTempSecret = crypto.createHash("sha256").update(testOtp).digest("hex");
      await pending.save();

      // 3. Verify
      const verifyRes = await request(app)
        .post("/api/auth/verify-signup-2fa")
        .send({
          userId,
          otp: testOtp
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe("Registration successful");
      expect(verifyRes.body).toHaveProperty("accessToken");
      expect(verifyRes.headers).toHaveProperty("set-cookie");

      const createdUser = await User.findOne({ email: "otp@example.com" });
      expect(createdUser).not.toBeNull();
    });

    it("should reject signup verification with invalid OTP", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "OTP Candidate",
          email: "otp@example.com",
          password: "Password123!",
          role: "candidate"
        });

      const userId = registerRes.body.userId;
      
      const verifyRes = await request(app)
        .post("/api/auth/verify-signup-2fa")
        .send({
          userId,
          otp: "000000" // Wrong OTP
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.message).toBe("Invalid OTP.");
    });

    it("should reject signup verification with expired OTP", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "OTP Candidate",
          email: "otp@example.com",
          password: "Password123!",
          role: "candidate"
        });

      const userId = registerRes.body.userId;
      const pending = await PendingUser.findById(userId);
      // Force OTP expired (created more than 10 mins ago)
      pending.createdAt = new Date(Date.now() - 15 * 60 * 1000);
      await pending.save();

      const verifyRes = await request(app)
        .post("/api/auth/verify-signup-2fa")
        .send({
          userId,
          otp: "123456"
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.message).toBe("OTP expired.");
    });
  });

  describe("Login Flow", () => {
    it("should login with valid credentials (non-2FA candidate)", async () => {
      const user = await createCandidate({ twoFactorEnabled: false });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: PASSWORD
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.headers).toHaveProperty("set-cookie");
    });

    it("should return OTP required status for 2FA-enabled user", async () => {
      const user = await createCandidate({ twoFactorEnabled: true });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: PASSWORD
        });

      expect(res.status).toBe(206);
      expect(res.body.twoFactorRequired).toBe(true);
      expect(res.body.message).toContain("OTP sent to your email");
    });

    it("should complete login for 2FA user with correct OTP", async () => {
      const user = await createCandidate({ twoFactorEnabled: true });

      // Trigger login first to create the OTP document
      await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: PASSWORD
        });

      // Find the generated OTP document in DB
      const otpDoc = await Otp.findOne({ user: user._id });
      expect(otpDoc).not.toBeNull();

      // Override with a known OTP
      const testOtp = "654321";
      otpDoc.otp = crypto.createHash("sha256").update(testOtp).digest("hex");
      await otpDoc.save();

      // Attempt login again with the OTP
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: PASSWORD,
          otp: testOtp
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should reject login with invalid password", async () => {
      const user = await createCandidate();

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "wrongpassword"
        });

      expect(res.status).toBe(401);
    });

    it("should reject login for unknown user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unknown@example.com",
          password: PASSWORD
        });

      expect(res.status).toBe(401);
    });
  });

  describe("Refresh Token Flow", () => {
    it("should successfully rotate refresh tokens and issue new access token", async () => {
      const user = await createCandidate();
      const initialRefreshToken = "test_refresh_token_string_123456";
      const hashedToken = crypto.createHash("sha256").update(initialRefreshToken).digest("hex");
      
      await RefreshToken.create({
        user: user._id,
        token: hashedToken
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [`refreshToken=${initialRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.headers).toHaveProperty("set-cookie");

      // Verify old token was rotated/updated
      const oldStored = await RefreshToken.findOne({ token: hashedToken });
      expect(oldStored).toBeNull();
    });

    it("should reject invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refreshToken=invalid_token"]);

      expect(res.status).toBe(401);
    });
  });

  describe("Logout Flow", () => {
    it("should revoke the refresh token and clear the cookie on logout", async () => {
      const user = await createCandidate();
      const refreshToken = "logout_test_refresh_token";
      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
      
      await RefreshToken.create({
        user: user._id,
        token: hashedToken
      });

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const storedToken = await RefreshToken.findOne({ token: hashedToken });
      expect(storedToken).toBeNull();
    });
  });
});
