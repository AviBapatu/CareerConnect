import resend from "../config/resend.js";

export const sendPasswordReset = async (email, resetURL) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Link",
      html: `
        <p>Click below to reset your password. This link is valid for 60 minutes:</p>
        <a href="${resetURL}">${resetURL}</a>
      `,
    });
    console.log("Password reset email sent:", data);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // Don't throw for now to avoid crashing auth flow, but log it.
  }
};

export const sendCustomEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Custom email sent:", data);
  } catch (error) {
    console.error("Error sending custom email:", error);
  }
};

export const send2FAOtp = async (email, otp) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your CareerConnect 2FA Verification Code",
      html: `
        <p>Your verification code is:</p>
        <h2 style="font-size:2rem;letter-spacing:0.2em;">${otp}</h2>
        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      `,
    });
    console.log("2FA OTP email sent:", data);
  } catch (error) {
    console.error("Error sending 2FA OTP email:", error);
    // Throwing error here usually stops the 2FA flow, which might be desired if email fails.
    // But for a migration, let's keep it safe. Use simple rethrow if critical.
    throw error;
  }
};

