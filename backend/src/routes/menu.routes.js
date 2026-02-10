import { Router } from "express";
import mongoose from "mongoose";
import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { validateBody } from "../middleware/validateBody.js";
import { createMenuItemSchema, updateMenuItemSchema } from "../validators/menu.validators.js";
import { Shop } from "../models/Shop.js";
import { MenuItem } from "../models/MenuItem.js";

const router = Router();

/**
 * Helper: verify shop exists, belongs to seller, and is APPROVED.
 */
async function assertSellerShop(req, res) {
  const { shopId } = req.params;

  if (!mongoose.isValidObjectId(shopId)) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid shopId" },
    });
    return null;
  }

  const shop = await Shop.findById(shopId);
  if (!shop) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Shop not found" },
    });
    return null;
  }

  if (shop.sellerClerkUserId !== req.user.clerkUserId) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Not your shop" },
    });
    return null;
  }

  if (shop.approvalStatus !== "APPROVED") {
    res.status(403).json({
      success: false,
      error: { code: "SHOP_NOT_APPROVED", message: "Shop is not approved" },
    });
    return null;
  }

  if (!shop.isActive) {
    res.status(403).json({
      success: false,
      error: { code: "SHOP_INACTIVE", message: "Shop is inactive" },
    });
    return null;
  }

  return shop;
}

/**
 * PUBLIC: GET /api/v1/shops/:shopId/menu
 * List menu items for a shop (approved shops only).
 * For now, we’ll only return available items.
 */
router.get("/shops/:shopId/menu", async (req, res, next) => {
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

    const items = await MenuItem.find({ shopId, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      data: items.map((i) => ({
        id: i._id,
        name: i.name,
        description: i.description,
        category: i.category,
        priceLkr: i.priceLkr,
        isAvailable: i.isAvailable,
        imageUrl: i.imageUrl,
        scope: i.scope,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * SELLER: POST /api/v1/shops/:shopId/menu
 * Create a menu item for your approved shop.
 * Server forces scope: SRI_LANKAN_RICE_AND_CURRY (V1).
 */
router.post(
  "/shops/:shopId/menu",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(createMenuItemSchema),
  async (req, res, next) => {
    try {
      const shop = await assertSellerShop(req, res);
      if (!shop) return;

      const item = await MenuItem.create({
        shopId: shop._id,
        sellerClerkUserId: req.user.clerkUserId,
        scope: "SRI_LANKAN_RICE_AND_CURRY", // enforced
        name: req.body.name,
        description: req.body.description || "",
        category: req.body.category,
        priceLkr: req.body.priceLkr,
        isAvailable: req.body.isAvailable ?? true,
        imageUrl: req.body.imageUrl || "",
      });

      res.status(201).json({
        success: true,
        data: {
          id: item._id,
          name: item.name,
          scope: item.scope,
          category: item.category,
          priceLkr: item.priceLkr,
          isAvailable: item.isAvailable,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: GET /api/v1/shops/:shopId/menu/all
 * Seller view all items for their shop (including unavailable).
 */
router.get(
  "/shops/:shopId/menu/all",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const shop = await assertSellerShop(req, res);
      if (!shop) return;

      const items = await MenuItem.find({ shopId: shop._id })
        .sort({ createdAt: -1 })
        .limit(500);

      res.json({
        success: true,
        data: items.map((i) => ({
          id: i._id,
          name: i.name,
          description: i.description ?? "",
          category: i.category,
          priceLkr: i.priceLkr,
          isAvailable: i.isAvailable,
          scope: i.scope,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: PATCH /api/v1/menu/:itemId
 * Update a menu item (only if it belongs to your shop).
 */
router.patch(
  "/menu/:itemId",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(updateMenuItemSchema),
  async (req, res, next) => {
    try {
      const { itemId } = req.params;
      if (!mongoose.isValidObjectId(itemId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid itemId" },
        });
      }

      const item = await MenuItem.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Menu item not found" },
        });
      }

      if (item.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Not your menu item" },
        });
      }

      // NEVER allow scope change
      const updates = { ...req.body };
      delete updates.scope;

      const updated = await MenuItem.findByIdAndUpdate(itemId, { $set: updates }, { new: true });

      res.json({
        success: true,
        data: {
          id: updated._id,
          name: updated.name,
          category: updated.category,
          priceLkr: updated.priceLkr,
          isAvailable: updated.isAvailable,
          scope: updated.scope,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: DELETE /api/v1/menu/:itemId
 * Delete a menu item (only if it belongs to your shop).
 */
router.delete(
  "/menu/:itemId",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { itemId } = req.params;
      if (!mongoose.isValidObjectId(itemId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid itemId" },
        });
      }

      const item = await MenuItem.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Menu item not found" },
        });
      }

      if (item.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Not your menu item" },
        });
      }

      await MenuItem.findByIdAndDelete(itemId);

      res.json({ success: true, data: { id: itemId, deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
