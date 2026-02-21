import { AppError } from "../utils/AppError.js";
import { catchAndWrap } from "../utils/catchAndWrap.js";
import Connection from "../models/Connection.js";
import {
  sendConnectionRequestSchema,
  respondConnectionRequestSchema,
  removeConnectionSchema,
} from "../zodSchema/connections.validation.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

import mongoose from "mongoose";

const searchUsersForConnection = async (req, res) => {
  const search = req.query.search?.trim();
  const companyId = req.query.companyId;

  req.log.info("[DEBUG] searchUsersForConnection - search:", search, "companyId:", companyId);

  if (!search) throw new AppError("Search query is required", 400);

  const currentUserId = req.user._id;

  // Base search conditions
  let userQuery = {
    _id: { $ne: currentUserId }, // Exclude current user
    $or: [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { headline: new RegExp(search, "i") },
      { location: new RegExp(search, "i") },
      { skills: { $elemMatch: { $regex: search, $options: "i" } } },
    ],
  };

  // ✅ If companyId is provided, filter only applicants for this company
  if (companyId) {
    try {
      const companyObjectId = new mongoose.Types.ObjectId(companyId);
      const applicantUserIds = await Application.distinct("user", { company: companyObjectId });

      req.log.info("[DEBUG] Applicant userIds for company:", companyId, applicantUserIds);

      if (applicantUserIds.length > 0) {
        userQuery._id.$in = applicantUserIds; // Add condition only if applicants exist
      } else {
        req.log.info("[DEBUG] No applicants found for this company");
      }
    } catch (err) {
      req.log.error("[ERROR] Invalid companyId format:", err);
    }
  }

  req.log.info("[DEBUG] Final userQuery:", JSON.stringify(userQuery));

  // Fetch users
  const users = await catchAndWrap(
    () => User.find(userQuery).select("name email avatarUrl headline location"),
    "Failed to search users"
  );

  req.log.info("[DEBUG] Users found:", users.length);

  const userIds = users.map((u) => u._id);

  // Fetch connection statuses
  const connections = await catchAndWrap(
    () =>
      Connection.find({
        $or: [
          { requester: currentUserId, recipient: { $in: userIds } },
          { recipient: currentUserId, requester: { $in: userIds } },
        ],
      }),
    "Failed to fetch connection statuses"
  );

  // Map connection statuses
  const statusMap = new Map();

  connections.forEach((conn) => {
    const otherUserId =
      conn.requester.toString() === currentUserId.toString()
        ? conn.recipient.toString()
        : conn.requester.toString();

    if (conn.status === "accepted") {
      statusMap.set(otherUserId, "accepted");
    } else if (
      conn.status === "pending" &&
      conn.requester.toString() === currentUserId.toString()
    ) {
      statusMap.set(otherUserId, "pending_sent");
    } else if (
      conn.status === "pending" &&
      conn.recipient.toString() === currentUserId.toString()
    ) {
      statusMap.set(otherUserId, "pending_received");
    }
  });

  // Final response
  const results = users.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    location: user.location,
    status: statusMap.get(user._id.toString()) || "none",
  }));

  res.status(200).json({ success: true, results });
};

export default searchUsersForConnection;


const sendConnectionRequest = async (req, res) => {
  const parsed = sendConnectionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }

  const { recipientId } = parsed.data;

  if (recipientId === req.user._id.toString()) {
    throw new AppError("You cannot send a request to yourself", 400);
  }

  const existing = await catchAndWrap(
    () =>
      Connection.findOne({
        requester: req.user._id,
        recipient: recipientId,
        status: { $ne: "rejected" },
      }),
    "Failed to check for existing request"
  );

  if (existing) {
    throw new AppError("Request already sent or pending", 400);
  }

  await catchAndWrap(
    () =>
      Connection.deleteMany({
        requester: req.user._id,
        recipient: recipientId,
        status: "rejected",
      }),
    "Failed to delete old rejected requests"
  );

  const connection = await catchAndWrap(
    () =>
      Connection.create({
        requester: req.user._id,
        recipient: recipientId,
      }),
    "Failed to send request"
  );

  res.status(201).json(connection);
};

const acceptConnectionRequest = async (req, res) => {
  const parsed = respondConnectionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const { requester } = parsed.data;

  const updated = await catchAndWrap(
    () =>
      Connection.findOneAndUpdate(
        { recipient: req.user._id, requester, status: "pending" },
        { status: "accepted" },
        { new: true }
      ),
    "Failed to accept request"
  );

  if (!updated) throw new AppError("No pending request found", 404);
  res.status(200).json(updated);
};

const rejectConnectionRequest = async (req, res) => {
  const parsed = respondConnectionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const { requester } = parsed.data;

  const updated = await catchAndWrap(
    () =>
      Connection.findOneAndUpdate(
        { recipient: req.user._id, requester, status: "pending" },
        { status: "rejected" },
        { new: true }
      ),
    "Failed to reject request"
  );

  if (!updated) throw new AppError("No pending request found", 404);
  res.status(200).json(updated);
};

const getAllConnections = async (req, res) => {
  const connections = await catchAndWrap(
    () =>
      Connection.find({
        $or: [
          { requester: req.user._id, status: "accepted" },
          { recipient: req.user._id, status: "accepted" },
        ],
      })
        .populate("requester", "name email")
        .populate("recipient", "name email"),
    "Failed to get connections"
  );

  res.status(200).json(connections);
};

const getSentRequests = async (req, res) => {
  const sent = await catchAndWrap(
    () =>
      Connection.find({
        requester: req.user._id,
        status: "pending",
      }).populate("recipient", "name email"),
    "Failed to get sent requests"
  );

  res.status(200).json(sent);
};

const getReceivedRequests = async (req, res) => {
  const received = await catchAndWrap(
    () =>
      Connection.find({
        recipient: req.user._id,
        status: "pending",
      }).populate("requester", "name email"),
    "Failed to get received requests"
  );

  res.status(200).json(received);
};

const getConnectionStatus = async (req, res) => {
  const { userId } = req.params;

  const connection = await catchAndWrap(
    () =>
      Connection.findOne({
        $or: [
          { requester: req.user._id, recipient: userId },
          { requester: userId, recipient: req.user._id },
        ],
      }),
    "Failed to check connection status"
  );

  if (!connection) return res.status(200).json({ status: "none" });

  res.status(200).json({ status: connection.status });
};

const removeConnection = async (req, res) => {
  const parsed = removeConnectionSchema.safeParse(req);
  if (!parsed.success) {
    throw new AppError("Validation failed", 400, parsed.error.errors);
  }
  const { userId: otherUserId } = parsed.data.params;
  const currentUserId = req.user?.id;
  req.log.info(`Other UserID: ${otherUserId}`);
  req.log.info(`current UserID: ${currentUserId}`);

  if (!currentUserId || !otherUserId) {
    throw new AppError("Invalid user ID(s)", 400);
  }

  const connection = await catchAndWrap(
    () =>
      Connection.findOneAndDelete({
        $or: [
          {
            requester: currentUserId,
            recipient: otherUserId,
            status: "accepted",
          },
          {
            requester: otherUserId,
            recipient: currentUserId,
            status: "accepted",
          },
        ],
      }),
    "Failed to remove connection"
  );

  if (!connection) throw new AppError("Connection not found", 404);

  res.status(200).json({
    success: true,
    message: "Connection removed successfully",
  });
};

export {
  searchUsersForConnection,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getAllConnections,
  getSentRequests,
  getReceivedRequests,
  getConnectionStatus,
  removeConnection,
};
