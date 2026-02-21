import rateLimit from "express-rate-limit";

// 1. Global Limiter - Applies to all API routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per `window`
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Auth Strict Limiter - Applies to login, register, password reset
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: {
        success: false,
        message:
            "Too many authentication attempts, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Application / Action Limiter - Applies to job actions, connections, company Invites
export const actionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Limit each IP to 30 requests per window
    message: {
        success: false,
        message:
            "You have performed this action too many times. Please wait an hour before trying again.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
