import jwt from "jsonwebtoken";
import crypto from "crypto";

export const signAccessToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: "15m"
    });

export const signRefreshToken = () =>
    crypto.randomBytes(64).toString("hex");
