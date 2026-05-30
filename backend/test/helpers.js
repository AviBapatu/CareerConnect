import mongoose from "mongoose";
import jwt from "jsonwebtoken";

/**
 * Clears all collections in the test MongoDB database.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Generates an access token for a given user ID.
 */
export const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY || "test_jwt_secret_key_12345_very_secure_and_long_enough", {
    expiresIn: "15m",
  });
};

/**
 * Generates the authorization header object for a user.
 */
export const authHeaders = (user) => {
  const token = generateTestToken(user._id || user.id);
  return {
    Authorization: `Bearer ${token}`,
  };
};
