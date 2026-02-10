import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validateBody.js";
import { createComplaintSchema, updateComplaintSchema } from "../validators/complaint.validators.js";
import { Order } from "../models/Order.js";
import { Complaint } from "../models/Complaint.js";

const router = Router();

/**
 * STUDENT: POST /api/v1/complaints
 * Create a complaint for an order.
 */
router.post(
  "/complaints",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  validateBody(createComplaintSchema),
  async (req, res, next) => {
    try {
      const { orderId, targetType, message } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid orderId" },
        });
      }

      const order = await Order.findById(orderId);
      if (!order || order.studentClerkUserId !== req.user.clerkUserId) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
      }

      const complaint = await Complaint.create({
        orderId: order._id,
        studentClerkUserId: req.user.clerkUserId,
        targetType: targetType || "ORDER",
        message: message.trim().slice(0, 1000),
        status: "OPEN",
      });

      res.status(201).json({
        success: true,
        data: {
          id: complaint._id,
          orderId: complaint.orderId,
          status: complaint.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: GET /api/v1/complaints/mine
 * List my complaints.
 */
router.get(
  "/complaints/mine",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  async (req, res, next) => {
    try {
      const list = await Complaint.find({ studentClerkUserId: req.user.clerkUserId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.json({
        success: true,
        data: list.map((c) => ({
          id: c._id,
          orderId: c.orderId,
          targetType: c.targetType,
          message: c.message,
          status: c.status,
          resolutionNotes: c.resolutionNotes || null,
          createdAt: c.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * ADMIN: GET /api/v1/admin/complaints
 * List all complaints (filter by status optional).
 */
router.get(
  "/admin/complaints",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["ADMIN"]),
  async (req, res, next) => {
    try {
      const status = req.query.status;
      const filter = status ? { status } : {};
      const list = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      res.json({
        success: true,
        data: list.map((c) => ({
          id: c._id,
          orderId: c.orderId,
          studentClerkUserId: c.studentClerkUserId,
          targetType: c.targetType,
          message: c.message,
          status: c.status,
          resolutionNotes: c.resolutionNotes || null,
          createdAt: c.createdAt,
          resolvedAt: c.resolvedAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * ADMIN: PATCH /api/v1/admin/complaints/:complaintId
 * Update status and/or resolution notes.
 */
router.patch(
  "/admin/complaints/:complaintId",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["ADMIN"]),
  validateBody(updateComplaintSchema),
  async (req, res, next) => {
    try {
      const { complaintId } = req.params;
      if (!mongoose.isValidObjectId(complaintId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid complaintId" },
        });
      }

      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Complaint not found" },
        });
      }

      const updates = { ...req.body };
      if (updates.status === "RESOLVED" || updates.status === "CLOSED") {
        updates.resolvedAt = new Date();
        updates.resolvedByClerkUserId = req.user.clerkUserId;
      }

      const updated = await Complaint.findByIdAndUpdate(
        complaintId,
        { $set: updates },
        { new: true }
      ).lean();

      res.json({
        success: true,
        data: {
          id: updated._id,
          status: updated.status,
          resolutionNotes: updated.resolutionNotes,
          resolvedAt: updated.resolvedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
