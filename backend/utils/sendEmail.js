import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (to, subject, html) => {
  await emailApi.sendTransacEmail({
    sender: {
      email: "connectcareer01@gmail.com",
      name: "CareerConnect",
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
};

export const sendPasswordReset = async (email, resetURL) => {
  try {
    const html = `
      <p>Click below to reset your password. This link is valid for 60 minutes:</p>
      <a href="${resetURL}">${resetURL}</a>
    `;
    await sendEmail(email, "Password Reset Link", html);
    console.log("Password reset email sent");
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

export const sendCustomEmail = async (to, subject, html) => {
  try {
    await sendEmail(to, subject, html);
    console.log("Custom email sent");
  } catch (error) {
    console.error("Error sending custom email:", error);
  }
};

export const send2FAOtp = async (email, otp) => {
  try {
    const html = `
      <p>Your verification code is:</p>
      <h2 style="font-size:2rem;letter-spacing:0.2em;">${otp}</h2>
      <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `;
    await sendEmail(email, "Your CareerConnect 2FA Verification Code", html);
    console.log("2FA OTP email sent");
  } catch (error) {
    console.error("Error sending 2FA OTP email:", error);
    throw error;
  }
};

