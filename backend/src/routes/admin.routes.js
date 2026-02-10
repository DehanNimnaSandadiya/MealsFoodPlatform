import { Router } from "express";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireSeedToken } from "../middleware/requireSeedToken.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";

const router = Router();

/**
 * POST /api/v1/admin/claim
 * Dev-only: promote the currently signed-in user to ADMIN (guarded by seed token header).
 * Header required: x-admin-seed-token: <ADMIN_SEED_TOKEN>
 */
router.post(
  "/claim",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireSeedToken,
  async (req, res, next) => {
    try {
      const updated = await User.findOneAndUpdate(
        { clerkUserId: req.user.clerkUserId },
        { $set: { role: "ADMIN", approvalStatus: "APPROVED", isActive: true } },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          clerkUserId: updated.clerkUserId,
          role: updated.role,
          approvalStatus: updated.approvalStatus,
          isActive: updated.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/reports/revenue
 * Platform revenue summary: commission from completed orders (current month).
 */
router.get(
  "/reports/revenue",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["ADMIN"]),
  async (req, res, next) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const summary = await Order.aggregate([
        {
          $match: {
            status: "COMPLETED",
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            grossLkr: { $sum: "$subtotalLkr" },
            commissionLkr: { $sum: "$commissionAmountLkr" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      const result = summary[0] || { grossLkr: 0, commissionLkr: 0, orderCount: 0 };

      res.json({
        success: true,
        data: {
          period: "current_month",
          startOfMonth,
          grossLkr: result.grossLkr,
          platformCommissionLkr: result.commissionLkr,
          orderCount: result.orderCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
