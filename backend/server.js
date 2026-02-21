import express from "express";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error.js";
import connectDB from "./config/connectDB.js";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import connectionRoutes from "./routes/connections.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import articleRoutes from "./routes/article.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import candidateDashboardRoutes from "./routes/candidateDashboard.routes.js";
import cors from "cors";
import "./models/Company.js";
import "./models/User.js";
import listEndpoints from "express-list-endpoints";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin: ["https://career-connect-avi.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

connectDB();
app.use(requestLogger);

app.use("/api", globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/connection", connectionRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/candidate-dashboard", candidateDashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// console.log("Available Routes:");
// console.log(JSON.stringify(listEndpoints(app), null, 2));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    logger.info(`Server is up Baby! Running on ${PORT}`);
  });
} catch (err) {
  logger.error("Server failed to start", err);
  process.exit(1);
}
