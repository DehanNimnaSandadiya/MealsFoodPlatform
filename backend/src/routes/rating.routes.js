import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validateBody.js";
import { createRatingSchema } from "../validators/rating.validators.js";
import { Order } from "../models/Order.js";
import { Rating } from "../models/Rating.js";
import { Shop } from "../models/Shop.js";

const router = Router();

/**
 * STUDENT: POST /api/v1/ratings
 * Submit rating for a completed order (seller + optional rider).
 */
router.post(
  "/ratings",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  validateBody(createRatingSchema),
  async (req, res, next) => {
    try {
      const { orderId, sellerRating, riderRating, comment } = req.body;

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

      if (order.status !== "COMPLETED") {
        return res.status(400).json({
          success: false,
          error: { code: "ORDER_NOT_COMPLETED", message: "Can only rate completed orders" },
        });
      }

      const existing = await Rating.findOne({ orderId: order._id });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: "ALREADY_RATED", message: "Order already rated" },
        });
      }

      const rating = await Rating.create({
        orderId: order._id,
        studentClerkUserId: req.user.clerkUserId,
        shopId: order.shopId,
        sellerClerkUserId: order.sellerClerkUserId,
        riderClerkUserId: order.riderClerkUserId || null,
        sellerRating,
        riderRating: riderRating ?? null,
        comment: (comment || "").trim().slice(0, 500),
      });

      res.status(201).json({
        success: true,
        data: {
          id: rating._id,
          orderId: rating.orderId,
          sellerRating: rating.sellerRating,
          riderRating: rating.riderRating,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUBLIC: GET /api/v1/shops/:shopId/ratings
 * List ratings for a shop (for display on shop detail). Returns summary + recent.
 */
router.get("/shops/:shopId/ratings", async (req, res, next) => {
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

    const ratings = await Rating.find({ shopId: shop._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const count = ratings.length;
    const avgSeller = count > 0
      ? ratings.reduce((s, r) => s + r.sellerRating, 0) / count
      : null;

    res.json({
      success: true,
      data: {
        averageRating: avgSeller ? Math.round(avgSeller * 10) / 10 : null,
        totalCount: count,
        recent: ratings.map((r) => ({
          sellerRating: r.sellerRating,
          riderRating: r.riderRating,
          comment: r.comment || null,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
