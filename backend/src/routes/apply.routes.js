import { Router } from "express";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { User } from "../models/User.js";

const router = Router();

/**
 * POST /api/v1/apply/seller
 * Converts current user into SELLER (PENDING)
 */
router.post(
  "/seller",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  async (req, res, next) => {
    try {
      const updated = await User.findOneAndUpdate(
        { clerkUserId: req.user.clerkUserId },
        { $set: { role: "SELLER", approvalStatus: "PENDING" } },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          clerkUserId: updated.clerkUserId,
          role: updated.role,
          approvalStatus: updated.approvalStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/apply/rider
 * Converts current user into RIDER (PENDING)
 */
router.post(
  "/rider",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  async (req, res, next) => {
    try {
      const updated = await User.findOneAndUpdate(
        { clerkUserId: req.user.clerkUserId },
        { $set: { role: "RIDER", approvalStatus: "PENDING" } },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          clerkUserId: updated.clerkUserId,
          role: updated.role,
          approvalStatus: updated.approvalStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
