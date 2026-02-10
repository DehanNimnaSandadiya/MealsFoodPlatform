import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { StudentAddress } from "../models/StudentAddress.js";

const router = Router();

const clerkUserId = (req) => req.user?.clerkUserId;

/**
 * STUDENT: GET /api/v1/addresses
 * List current user's saved addresses.
 */
router.get(
  "/addresses",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const list = await StudentAddress.find({ clerkUserId: clerkUserId(req) })
        .sort({ isDefault: -1, createdAt: 1 })
        .lean();
      res.json({
        success: true,
        data: list.map((a) => ({
          id: a._id,
          label: a.label,
          address: a.address,
          isDefault: a.isDefault,
          createdAt: a.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: POST /api/v1/addresses
 * Create a saved address.
 */
router.post(
  "/addresses",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { label, address, isDefault } = req.body;
      if (!address || typeof address !== "string" || address.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ADDRESS", message: "Address must be at least 5 characters" },
        });
      }
      const uid = clerkUserId(req);
      if (isDefault) {
        await StudentAddress.updateMany(
          { clerkUserId: uid },
          { $set: { isDefault: false } }
        );
      }
      const doc = await StudentAddress.create({
        clerkUserId: uid,
        label: label?.trim?.()?.slice(0, 80) || undefined,
        address: address.trim().slice(0, 300),
        isDefault: Boolean(isDefault),
      });
      res.status(201).json({
        success: true,
        data: {
          id: doc._id,
          label: doc.label,
          address: doc.address,
          isDefault: doc.isDefault,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: PATCH /api/v1/addresses/:id
 * Update a saved address (label, address, isDefault).
 */
router.patch(
  "/addresses/:id",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { label, address, isDefault } = req.body;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid address id" },
        });
      }
      const uid = clerkUserId(req);
      const doc = await StudentAddress.findOne({ _id: id, clerkUserId: uid });
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Address not found" },
        });
      }
      if (address !== undefined) {
        const a = typeof address === "string" ? address.trim() : "";
        if (a.length < 5) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_ADDRESS", message: "Address must be at least 5 characters" },
          });
        }
        doc.address = a.slice(0, 300);
      }
      if (label !== undefined) doc.label = label?.trim?.()?.slice(0, 80) ?? doc.label;
      if (isDefault === true) {
        await StudentAddress.updateMany(
          { clerkUserId: uid, _id: { $ne: doc._id } },
          { $set: { isDefault: false } }
        );
        doc.isDefault = true;
      } else if (isDefault === false) doc.isDefault = false;
      await doc.save();
      res.json({
        success: true,
        data: {
          id: doc._id,
          label: doc.label,
          address: doc.address,
          isDefault: doc.isDefault,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: DELETE /api/v1/addresses/:id
 */
router.delete(
  "/addresses/:id",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid address id" },
        });
      }
      const deleted = await StudentAddress.findOneAndDelete({
        _id: id,
        clerkUserId: clerkUserId(req),
      });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Address not found" },
        });
      }
      res.json({ success: true, data: { id: deleted._id } });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: POST /api/v1/addresses/:id/default
 * Set this address as the default.
 */
router.post(
  "/addresses/:id/default",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid address id" },
        });
      }
      const uid = clerkUserId(req);
      const doc = await StudentAddress.findOne({ _id: id, clerkUserId: uid });
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Address not found" },
        });
      }
      await StudentAddress.updateMany(
        { clerkUserId: uid },
        { $set: { isDefault: false } }
      );
      doc.isDefault = true;
      await doc.save();
      res.json({
        success: true,
        data: {
          id: doc._id,
          label: doc.label,
          address: doc.address,
          isDefault: true,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
