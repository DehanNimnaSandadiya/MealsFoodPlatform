import { Router } from "express";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validateBody.js";
import { setApprovalSchema } from "../validators/admin.validators.js";
import { User } from "../models/User.js";
import { Shop } from "../models/Shop.js";

const router = Router();

// Everything here is ADMIN-only
router.use(clerkAuth, requireAuth, loadUserContext, requireActiveUser, requireRole(["ADMIN"]));

/**
 * GET /api/v1/admin/approvals/users?status=PENDING
 */
router.get("/users", async (req, res, next) => {
  try {
    const status = (req.query.status || "PENDING").toString();
    const users = await User.find({ approvalStatus: status }).sort({ createdAt: -1 }).limit(200);

    res.json({
      success: true,
      data: users.map((u) => ({
        clerkUserId: u.clerkUserId,
        role: u.role,
        approvalStatus: u.approvalStatus,
        rejectionReason: u.rejectionReason ?? null,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/approvals/users/:clerkUserId
 * body: { approvalStatus }
 */
router.patch("/users/:clerkUserId", validateBody(setApprovalSchema), async (req, res, next) => {
  try {
    const { clerkUserId } = req.params;
    const { approvalStatus, rejectionReason } = req.body;

    const update = { approvalStatus };
    if (approvalStatus === "REJECTED" && rejectionReason != null) {
      update.rejectionReason = String(rejectionReason).trim().slice(0, 500) || null;
    } else if (approvalStatus !== "REJECTED") {
      update.rejectionReason = null;
    }

    const updated = await User.findOneAndUpdate(
      { clerkUserId },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

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
});

/**
 * GET /api/v1/admin/approvals/shops?status=PENDING
 */
router.get("/shops", async (req, res, next) => {
  try {
    const status = (req.query.status || "PENDING").toString();
    const shops = await Shop.find({ approvalStatus: status }).sort({ createdAt: -1 }).limit(200);

    res.json({
      success: true,
      data: shops.map((s) => ({
        id: s._id,
        sellerClerkUserId: s.sellerClerkUserId,
        name: s.name,
        approvalStatus: s.approvalStatus,
        rejectionReason: s.rejectionReason ?? null,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/approvals/shops/:shopId
 * body: { approvalStatus }
 */
router.patch("/shops/:shopId", validateBody(setApprovalSchema), async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { approvalStatus, rejectionReason } = req.body;

    const update = { approvalStatus };
    if (approvalStatus === "REJECTED" && rejectionReason != null) {
      update.rejectionReason = String(rejectionReason).trim().slice(0, 500) || null;
    } else if (approvalStatus !== "REJECTED") {
      update.rejectionReason = null;
    }

    const updated = await Shop.findByIdAndUpdate(
      shopId,
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Shop not found" },
      });
    }

    res.json({
      success: true,
      data: {
        id: updated._id,
        approvalStatus: updated.approvalStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
