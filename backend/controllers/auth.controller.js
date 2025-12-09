import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import { sendPasswordReset } from "../utils/sendEmail.js";
import { send2FAOtp } from "../utils/sendEmail.js";
import {
  signUpSchema,
  logInSchema,
  resetPasswordParamsSchema,
  resetPasswordBodySchema,
  updateUserRoleSchema,
} from "../zodSchema/auth.validation.js";

const registerUser = async (req, res) => {
  const result = signUpSchema.safeParse(req.body);
  if (!result.success) {
    throw result.error;
  }

  const { name, email, password, role } = result.data;

  // Check if user already exists in User
  const isExistingUser = await User.findOne({ email });
  if (isExistingUser) throw new AppError("User already exists", 409);

  // If a pending user exists, delete it before creating a new one
  const isPending = await PendingUser.findOne({ email });
  if (isPending) await PendingUser.deleteOne({ email });

  const hashed = await bcrypt.hash(password, 10);
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Store in PendingUser
  const pending = await PendingUser.create({
    name,
    email,
    password: hashed,
    role,
    twoFactorTempSecret: hashedOtp,
    twoFactorOTPExpires: otpExpires,
  });
  await send2FAOtp(email, otp);

  res.status(201).json({
    message: "OTP sent to your email. Please verify to complete registration.",
    twoFactorRequired: true,
    userId: pending._id,
    email: pending.email,
  });
};

const verifySignup2FA = async (req, res) => {
  const { userId, otp } = req.body;
  const pending = await PendingUser.findById(userId);
  if (!pending)
    return res
      .status(404)
      .json({ success: false, message: "Pending registration not found" });
  if (!pending.twoFactorTempSecret || !pending.twoFactorOTPExpires)
    return res
      .status(400)
      .json({ success: false, message: "No OTP requested." });
  if (pending.twoFactorOTPExpires < new Date())
    return res.status(400).json({ success: false, message: "OTP expired." });
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== pending.twoFactorTempSecret)
    return res.status(400).json({ success: false, message: "Invalid OTP." });

  // Create user in User collection
  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    role: pending.role,
    twoFactorEnabled: true,
  });
  // Remove pending registration by email
  await PendingUser.deleteOne({ email: pending.email });

  const token = signToken({ id: user._id, role: user.role });
  res.status(200).json({
    message: "Registration successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const enable2FA = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (user.twoFactorEnabled)
    return res
      .status(400)
      .json({ success: false, message: "2FA is already enabled." });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.twoFactorTempSecret = hashedOtp;
  user.twoFactorOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await user.save();
  await send2FAOtp(user.email, otp);
  res.status(200).json({ success: true, message: "OTP sent to your email." });
};

const verify2FA = async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (!user.twoFactorTempSecret || !user.twoFactorOTPExpires)
    return res
      .status(400)
      .json({ success: false, message: "No OTP requested." });
  if (user.twoFactorOTPExpires < new Date())
    return res.status(400).json({ success: false, message: "OTP expired." });
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.twoFactorTempSecret)
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  user.twoFactorEnabled = true;
  user.twoFactorTempSecret = undefined;
  user.twoFactorOTPExpires = undefined;
  await user.save();
  res.status(200).json({ success: true, message: "2FA enabled successfully." });
};

// 2FA login step: after password, send OTP
const loginUser = async (req, res) => {
  console.log("[loginUser] Request body:", req.body);
  const result = logInSchema.safeParse(req.body);
  if (!result.success) {
    console.log("[loginUser] Invalid input:", result.error);
    throw new AppError("Invalid Input", 400);
  }

  const { email, password, otp } = result.data;
  console.log("[loginUser] Parsed data:", { email, password, otp });

  const user = await User.findOne({ email });
  if (!user) {
    console.log("[loginUser] User not found for email:", email);
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log("[loginUser] Password mismatch for email:", email);
    throw new AppError("Invalid email or password", 401);
  }

  // If 2FA is enabled, require OTP
  if (user.twoFactorEnabled) {
    console.log("[loginUser] 2FA is enabled for user:", email);
    // If OTP is not provided, send OTP and require it
    if (!otp) {
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const hashedOtp = crypto
        .createHash("sha256")
        .update(generatedOtp)
        .digest("hex");
      user.twoFactorTempSecret = hashedOtp;
      user.twoFactorOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      console.log(
        "[loginUser] Generated and saved OTP for user:",
        email,
        "OTP:",
        generatedOtp
      );
      await send2FAOtp(user.email, generatedOtp);
      console.log("[loginUser] Sent OTP email to:", user.email);
      return res.status(206).json({
        success: false,
        message: "OTP sent to your email. Please verify to complete login.",
        twoFactorRequired: true,
      });
    } else {
      // Verify OTP
      console.log(
        "[loginUser] Verifying OTP for user:",
        email,
        "OTP provided:",
        otp
      );
      if (!user.twoFactorTempSecret || !user.twoFactorOTPExpires) {
        console.log("[loginUser] No OTP requested for user:", email);
        throw new AppError("No OTP requested.", 400);
      }
      if (user.twoFactorOTPExpires < new Date()) {
        console.log("[loginUser] OTP expired for user:", email);
        throw new AppError("OTP expired.", 400);
      }
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
      if (hashedOtp !== user.twoFactorTempSecret) {
        console.log(
          "[loginUser] Invalid OTP for user:",
          email,
          "Provided:",
          otp,
          "Expected:",
          user.twoFactorTempSecret
        );
        throw new AppError("Invalid OTP.", 400);
      }
      user.twoFactorTempSecret = undefined;
      user.twoFactorOTPExpires = undefined;
      await user.save();
      console.log("[loginUser] OTP validated and cleared for user:", email);
    }
  }

  const token = signToken({ id: user._id, role: user.role });
  console.log("[loginUser] Login successful for user:", email);

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      companyRole: user.companyRole,
    },
  });
};

const getMe = async (req, res) => {
  const user = await catchAndWrap(() =>
    User.findById(req.user._id).populate("company")
  );
  // If global role is recruiter and companyRole is employee, update global role to candidate
  if (user.role === "recruiter" && user.companyRole === "employee") {
    user.role = "candidate";
    await user.save();
  }
  // If global role is candidate and companyRole is recruiter or admin, update global role to recruiter
  if (
    user.role === "candidate" &&
    ["recruiter", "admin"].includes(user.companyRole)
  ) {
    user.role = "recruiter";
    await user.save();
  }
  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company ? user.company._id : null,
    companyRole: user.companyRole || null,
    twoFactorEnabled: user.twoFactorEnabled || false,
    resumeUrl: user.resumeUrl || null,
  });
};

const updateMe = async (req, res) => {
  const userId = req.user._id;
  const { role } = req.body;
  console.log(role);
  if (!role || !["candidate", "recruiter"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role." });
  }
  const user = await User.findById(userId).populate("company");
  console.log(user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  user.role = role;

  console.log(user.role);
  await user.save();

  // Return the same format as getMe for consistency
  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company ? user.company._id : null,
    companyRole: user.companyRole || null,
    twoFactorEnabled: user.twoFactorEnabled || false,
    resumeUrl: user.resumeUrl || null,
  });
};

const logOut = async (req, res) => {
  res.status(200).json({ message: "Logged out" });
};

const updateUserRole = async (req, res) => {
  const parsed = updateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { newRole } = parsed.data;

  if (req.user.role === newRole) {
    throw new AppError("You already have this role", 400);
  }

  const updatedUser = await catchAndWrap(
    () => User.findByIdAndUpdate(req.user.id, { role: newRole }, { new: true }),
    "Failed to update role",
    500
  );

  res.status(200).json({
    success: true,
    message: "Role updated. Please login again.",
    updatedRole: updatedUser.role,
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is not found", 400);

  const user = await catchAndWrap(
    () => User.findOne({ email }),
    "User not found",
    404
  );

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password/${token}/${user._id}`;
  await sendPasswordReset(email, resetURL);

  res.status(200).json({ message: "Password reset link sent successfully" });
};

const resetPassword = async (req, res) => {
  const paramsResult = resetPasswordParamsSchema.safeParse(req.params);
  const bodyResult = resetPasswordBodySchema.safeParse(req.body);

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({
      success: false,
      errors: {
        params: paramsResult.error?.flatten(),
        body: bodyResult.error?.flatten(),
      },
    });
  }

  const { token, id } = paramsResult.data;
  const { password } = bodyResult.data;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await catchAndWrap(
    () =>
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          companyRole: user.companyRole,
          resumeUrl: user.resumeUrl || null,
        },
      }));

  await user.save();

  res.status(200).json({ message: "Password was reset successfully." });
};

const disable2FA = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (!user.twoFactorEnabled)
    return res
      .status(400)
      .json({ success: false, message: "2FA is not enabled." });
  user.twoFactorEnabled = false;
  user.twoFactorTempSecret = undefined;
  user.twoFactorOTPExpires = undefined;
  await user.save();
  res
    .status(200)
    .json({ success: true, message: "2FA disabled successfully." });
};

export {
  registerUser,
  loginUser,
  verify2FA,
  enable2FA,
  getMe,
  logOut,
  updateUserRole,
  forgotPassword,
  resetPassword,
  disable2FA,
  verifySignup2FA,
  updateMe,
};
