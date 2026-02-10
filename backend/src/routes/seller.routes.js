import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { Order } from "../models/Order.js";
import { Shop } from "../models/Shop.js";
import { getSalesSummaryForSeller, generateInsightsFromSales } from "../services/aiInsights.service.js";

const router = Router();

/**
 * SELLER: GET /api/v1/seller/earnings/summary
 * Current month gross revenue and 10% commission from completed orders (seller's shops).
 */
router.get(
  "/seller/earnings/summary",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const shopIds = await Shop.find({ sellerClerkUserId: req.user.clerkUserId }).distinct("_id");
      const completed = await Order.aggregate([
        {
          $match: {
            shopId: { $in: shopIds.map((id) => new mongoose.Types.ObjectId(id)) },
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

      const result = completed[0] || { grossLkr: 0, commissionLkr: 0, orderCount: 0 };

      res.json({
        success: true,
        data: {
          period: "current_month",
          startOfMonth,
          grossLkr: result.grossLkr,
          commissionLkr: result.commissionLkr,
          commissionRate: 0.1,
          orderCount: result.orderCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: GET /api/v1/seller/insights
 * AI-generated insights from sales data (completed orders, top items, by day).
 * Uses OPENAI_API_KEY if set; otherwise returns data-based tips.
 */
router.get(
  "/seller/insights",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const summary = await getSalesSummaryForSeller(req.user.clerkUserId);
      const insights = await generateInsightsFromSales(summary, req.log);

      res.json({
        success: true,
        data: {
          insights,
          summary: {
            orderCount: summary.orderCount,
            totalLkr: summary.totalLkr,
            periodDays: summary.periodDays,
            topItems: summary.topItems?.slice(0, 5) ?? [],
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
