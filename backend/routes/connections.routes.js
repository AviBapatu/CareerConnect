import { Router } from "express";
import { authentication } from "../middleware/auth.js";
import {
  searchUsersForConnection,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getAllConnections,
  getSentRequests,
  getReceivedRequests,
  getConnectionStatus,
  removeConnection,
} from "../controllers/connections.controller.js";
import { actionLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authentication);

router.get("/search", searchUsersForConnection);
router.post("/request", actionLimiter, sendConnectionRequest);
router.patch("/accept", acceptConnectionRequest);
router.patch("/reject/:requesterId", rejectConnectionRequest);
router.get("/all", getAllConnections);
router.get("/sent", getSentRequests);
router.get("/received", getReceivedRequests);
router.get("/status/:userId", getConnectionStatus);
router.delete("/delete/:userId", removeConnection);

export default router;
