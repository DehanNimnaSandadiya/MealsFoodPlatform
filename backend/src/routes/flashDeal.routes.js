import { Router } from "express";
import mongoose from "mongoose";

import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { validateBody } from "../middleware/validateBody.js";

import { Shop } from "../models/Shop.js";
import { MenuItem } from "../models/MenuItem.js";
import { FlashDeal } from "../models/FlashDeal.js";
import { createFlashDealSchema, updateFlashDealSchema } from "../validators/flashDeal.validators.js";

const router = Router();

function nowUtc() {
  return new Date();
}

function calcDiscountedPrice(priceLkr, discountType, discountValue) {
  let discounted = priceLkr;

  if (discountType === "PERCENT") {
    discounted = Math.round(priceLkr * (1 - discountValue / 100));
  } else if (discountType === "FLAT_LKR") {
    discounted = Math.round(priceLkr - discountValue);
  }

  // never allow free/negative
  if (discounted < 50) discounted = 50;

  // never allow more than original
  if (discounted > priceLkr) discounted = priceLkr;

  return discounted;
}

/**
 * SELLER: POST /api/v1/flash-deals
 * Create a flash deal for approved shop and menu items.
 * Enforces: Sri Lankan Rice & Curry only.
 */
router.post(
  "/flash-deals",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(createFlashDealSchema),
  async (req, res, next) => {
    try {
      const { shopId, title, menuItemIds, discountType, discountValue, startAt, endAt } = req.body;

      if (!mongoose.isValidObjectId(shopId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid shopId" } });
      }

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Shop not found" } });
      }

      if (shop.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your shop" } });
      }

      if (!shop.isActive || shop.approvalStatus !== "APPROVED") {
        return res.status(403).json({
          success: false,
          error: { code: "SHOP_NOT_APPROVED", message: "Shop must be approved and active" },
        });
      }

      // parse dates
      const start = new Date(startAt);
      const end = new Date(endAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DATE", message: "startAt/endAt must be ISO datetime" },
        });
      }

      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_WINDOW", message: "endAt must be after startAt" },
        });
      }

      // validate menu items belong to this shop + are Rice&Curry scope
      const ids = menuItemIds.map((id) => id.trim());
      const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

      const items = await MenuItem.find({
        _id: { $in: objectIds },
        shopId: shop._id,
        scope: "SRI_LANKAN_RICE_AND_CURRY",
      });

      if (items.length !== ids.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_MENU_ITEMS",
            message: "All menuItemIds must belong to this shop and be Sri Lankan Rice & Curry scope",
          },
        });
      }

      // discount sanity
      if (discountType === "PERCENT" && (discountValue <= 0 || discountValue > 90)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DISCOUNT", message: "Percent discount must be 1..90" },
        });
      }

      if (discountType === "FLAT_LKR" && discountValue < 10) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_DISCOUNT", message: "Flat discount must be >= 10 LKR" },
        });
      }

      const deal = await FlashDeal.create({
        shopId: shop._id,
        sellerClerkUserId: req.user.clerkUserId,
        title,
        menuItemIds: objectIds,
        discountType,
        discountValue,
        startAt: start,
        endAt: end,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        data: {
          id: deal._id,
          shopId: String(deal.shopId),
          title: deal.title,
          discountType: deal.discountType,
          discountValue: deal.discountValue,
          startAt: deal.startAt,
          endAt: deal.endAt,
          isActive: deal.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: GET /api/v1/flash-deals?shopId=...
 * List flash deals for a shop (own shop only).
 */
router.get(
  "/flash-deals",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const shopId = req.query.shopId;
      if (!shopId || !mongoose.isValidObjectId(shopId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Valid shopId query required" },
        });
      }
      const shop = await Shop.findById(shopId);
      if (!shop || shop.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Not your shop" },
        });
      }
      const deals = await FlashDeal.find({ shopId: shop._id })
        .sort({ startAt: -1 })
        .limit(100)
        .lean();

      res.json({
        success: true,
        data: deals.map((d) => ({
          id: d._id,
          shopId: d.shopId,
          title: d.title,
          menuItemIds: (d.menuItemIds || []).map(String),
          discountType: d.discountType,
          discountValue: d.discountValue,
          startAt: d.startAt,
          endAt: d.endAt,
          isActive: d.isActive,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: PATCH /api/v1/flash-deals/:dealId
 * Enable/disable or rename.
 */
router.patch(
  "/flash-deals/:dealId",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(updateFlashDealSchema),
  async (req, res, next) => {
    try {
      const { dealId } = req.params;
      if (!mongoose.isValidObjectId(dealId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid dealId" } });
      }

      const deal = await FlashDeal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Deal not found" } });
      }

      if (deal.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your deal" } });
      }

      const updated = await FlashDeal.findByIdAndUpdate(dealId, { $set: req.body }, { new: true });

      res.json({
        success: true,
        data: {
          id: updated._id,
          title: updated.title,
          isActive: updated.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUBLIC: GET /api/v1/flash-deals/active
 * List active deals right now + include discounted menu item preview.
 */
router.get("/flash-deals/active", async (req, res, next) => {
  try {
    const now = nowUtc();

    const deals = await FlashDeal.find({
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now },
    })
      .sort({ endAt: 1 })
      .limit(50);

    const allItemIds = deals.flatMap((d) => d.menuItemIds);
    const menuItems = await MenuItem.find({
      _id: { $in: allItemIds },
      isAvailable: true,
      scope: "SRI_LANKAN_RICE_AND_CURRY",
    });

    const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));

    const payload = deals.map((d) => {
      const items = d.menuItemIds
        .map((id) => {
          const m = menuMap.get(String(id));
          if (!m) return null;
          const discountedPriceLkr = calcDiscountedPrice(m.priceLkr, d.discountType, d.discountValue);
          return {
            menuItemId: String(m._id),
            name: m.name,
            category: m.category,
            originalPriceLkr: m.priceLkr,
            discountedPriceLkr,
          };
        })
        .filter(Boolean);

      return {
        id: String(d._id),
        shopId: String(d.shopId),
        title: d.title,
        discountType: d.discountType,
        discountValue: d.discountValue,
        startAt: d.startAt,
        endAt: d.endAt,
        items,
      };
    });

    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
});

export default router;
