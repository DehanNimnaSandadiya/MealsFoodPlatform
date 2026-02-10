import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { validateBody } from "../middleware/validateBody.js";
import { createShopSchema } from "../validators/shop.validators.js";
import { Shop } from "../models/Shop.js";

const router = Router();

/**
 * PUBLIC: GET /api/v1/shops
 * List approved, active shops (for students browsing).
 */
router.get("/", async (req, res, next) => {
  try {
    const shops = await Shop.find({
      approvalStatus: "APPROVED",
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("name address phone createdAt");

    res.json({
      success: true,
      data: shops.map((s) => ({
        id: s._id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/shops/mine
 * Seller views their shops (must be before /:shopId)
 */
router.get(
  "/mine",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const shops = await Shop.find({ sellerClerkUserId: req.user.clerkUserId })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: shops.map((s) => ({
          id: s._id,
          name: s.name,
          approvalStatus: s.approvalStatus,
          isActive: s.isActive,
          createdAt: s.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUBLIC: GET /api/v1/shops/:shopId
 * Single shop details (approved only).
 */
router.get("/:shopId", async (req, res, next) => {
  try {
    const { shopId } = req.params;
    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid shopId" },
      });
    }
    const shop = await Shop.findById(shopId);
    if (!shop || shop.approvalStatus !== "APPROVED" || !shop.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Shop not found" },
      });
    }
    res.json({
      success: true,
      data: {
        id: shop._id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        createdAt: shop.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/shops
 * Seller creates a shop (shop starts PENDING)
 * Seller must be APPROVED.
 */
router.post(
  "/",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(createShopSchema),
  async (req, res, next) => {
    try {
      const shop = await Shop.create({
        sellerClerkUserId: req.user.clerkUserId,
        ...req.body,
        approvalStatus: "PENDING",
        isActive: true,
        commissionRate: 0.1,
        aiPremiumEnabled: true,
      });

      res.status(201).json({
        success: true,
        data: {
          id: shop._id,
          name: shop.name,
          approvalStatus: shop.approvalStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
