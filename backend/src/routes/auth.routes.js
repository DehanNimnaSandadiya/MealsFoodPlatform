import { Router } from "express";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";

const router = Router();

/**
 * GET /api/v1/auth/me
 * Creates Mongo user on first login (bootstrap), returns app role + approval status.
 */
router.get("/me", clerkAuth, requireAuth, loadUserContext, (req, res) => {
  res.json({
    success: true,
    data: {
      clerkUserId: req.user.clerkUserId,
      role: req.user.role,
      approvalStatus: req.user.approvalStatus,
      isActive: req.user.isActive,
    },
  });
});

/**
 * GET /api/v1/auth/admin-ping
 * RBAC smoke test: Only ADMIN can access
 */
router.get(
  "/admin-ping",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["ADMIN"]),
  (req, res) => {
    res.json({ success: true, data: { ok: true } });
  }
);


export default router;
