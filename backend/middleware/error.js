import { logger } from "../utils/logger.js";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  logger.error("unhandled error:", err);

  let statusCode = 500;
  let message = "Something went wrong! Please try again.";
  let errors = [];

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode || 500;
    message = err.message || message;
    errors = err.errors || [];
  }

  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed!";
    errors = err.errors || [];
  }

  // Send response
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && {
      errors: errors.map((e) => ({
        path: Array.isArray(e.path) ? e.path.join(".") : "unknown",
        message: e.message || "Invalid input",
      })),
    }),
  });
};
