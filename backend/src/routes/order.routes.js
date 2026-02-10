import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import { clerkAuth, requireAuth } from "../middleware/requireAuth.js";
import { loadUserContext } from "../middleware/loadUserContext.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireApproval } from "../middleware/requireApproval.js";
import { validateBody } from "../middleware/validateBody.js";

import { Shop } from "../models/Shop.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { StudentAddress } from "../models/StudentAddress.js";
import { FlashDeal } from "../models/FlashDeal.js";
import { buildItemDealPrices } from "../utils/flashDeal.js";

import { sendOrderOtpEmail } from "../services/email.service.js";


import {
  placeOrderSchema,
  sellerStatusSchema,
  riderActionSchema,
  otpVerifySchema,
} from "../validators/order.validators.js";

import { generateOtp6, hashOtp } from "../utils/otp.js";
import { assertTransition } from "../utils/orderLifecycle.js";

const router = Router();

// OTP verify endpoint must be rate-limited (attempt-limited + verify endpoint rate-limited)
const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * STUDENT: POST /api/v1/orders
 * Place order (server calculates totals + generates OTP).
 */
router.post(
  "/orders",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  requireApproval(["APPROVED"]),
  validateBody(placeOrderSchema),
  async (req, res, next) => {
    try {
      const { shopId, items, deliveryAddress: bodyAddress, addressId, distanceKm } = req.body;

      let deliveryAddress = bodyAddress;
      if (addressId && mongoose.isValidObjectId(addressId)) {
        const saved = await StudentAddress.findOne({
          _id: addressId,
          clerkUserId: req.user.clerkUserId,
        });
        if (!saved) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_ADDRESS", message: "Saved address not found" },
          });
        }
        deliveryAddress = saved.address;
      }
      if (!deliveryAddress || deliveryAddress.length < 5) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ADDRESS", message: "Valid delivery address is required" },
        });
      }

      if (!mongoose.isValidObjectId(shopId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid shopId" },
        });
      }

      const shop = await Shop.findById(shopId);
      if (!shop || !shop.isActive || shop.approvalStatus !== "APPROVED") {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Shop not found" },
        });
      }

      // fetch menu items and validate they belong to this shop + are available + scope enforced
      const menuIds = items.map((i) => i.menuItemId).filter(Boolean);
      const objectIds = menuIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (objectIds.length !== items.length) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid menuItemId in items" },
        });
      }

      const menuItems = await MenuItem.find({
        _id: { $in: objectIds },
        shopId: shop._id,
        isAvailable: true,
        scope: "SRI_LANKAN_RICE_AND_CURRY", // hard scope
      });

      if (menuItems.length !== items.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ITEMS",
            message: "Some items are not available for this shop (or not Rice & Curry scope)",
          },
        });
      }

      const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));

      const now = new Date();
      const activeDeals = await FlashDeal.find({
        shopId: shop._id,
        isActive: true,
        startAt: { $lte: now },
        endAt: { $gte: now },
      }).lean();
      const itemDealPrices = buildItemDealPrices(activeDeals, menuItems);

      const orderItems = items.map((i) => {
        const m = menuMap.get(String(i.menuItemId));
        const deal = itemDealPrices.get(String(i.menuItemId));
        const priceLkr = deal ? deal.discountedPriceLkr : m.priceLkr;
        const lineTotal = priceLkr * i.qty;
        return {
          menuItemId: m._id,
          nameSnapshot: m.name,
          priceLkrSnapshot: priceLkr,
          qty: i.qty,
          lineTotalLkr: lineTotal,
        };
      });

      const subtotalLkr = orderItems.reduce((sum, it) => sum + it.lineTotalLkr, 0);

      const commissionRate = 0.1; // fixed v1
      const commissionAmountLkr = Math.round(subtotalLkr * commissionRate);

      const riderFeePerKmLkr = 25;
      const riderFeeLkr = Math.round(distanceKm * riderFeePerKmLkr);

      const totalLkr = subtotalLkr; // student pays subtotal; commissions/fees recorded separately in system

      // OTP: generate + hash, expiry 30 mins
      const otp = generateOtp6();
      const otpHash = hashOtp(otp);
      const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const order = await Order.create({
        studentClerkUserId: req.user.clerkUserId,
        sellerClerkUserId: shop.sellerClerkUserId,
        riderClerkUserId: null,
        shopId: shop._id,

        status: "PLACED",
        items: orderItems,

        subtotalLkr,
        commissionRate,
        commissionAmountLkr,
        totalLkr,

        distanceKm,
        riderFeePerKmLkr,
        riderFeeLkr,

        deliveryAddress,

        otpHash,
        otpExpiresAt,
        otpUsedAt: null,
        otpAttempts: 0,

        statusHistory: [{ status: "PLACED", at: now, byClerkUserId: req.user.clerkUserId }],
      });

      // Email OTP to student (V1 requirement: OTP also shown in dashboard)
        try {
            await sendOrderOtpEmail({
            clerkUserId: req.user.clerkUserId,
            otp,
            orderId: String(order._id),
            });
        } catch (e) {
            // Never fail order creation because email failed (log + continue)
            req.log.error({ err: e }, "Failed to send OTP email");
        }
  

      // Return OTP for now in response (dev). Student dashboard will show it.
      res.status(201).json({
        success: true,
        data: {
          id: order._id,
          status: order.status,
          totalLkr: order.totalLkr,
          otp, // V1 requirement: shown in student dashboard + emailed (we’ll email later)
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: GET /api/v1/orders/mine
 */
router.get(
  "/orders/mine",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  async (req, res, next) => {
    try {
      const orders = await Order.find({ studentClerkUserId: req.user.clerkUserId })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: orders.map((o) => ({
          id: o._id,
          status: o.status,
          totalLkr: o.totalLkr,
          shopId: o.shopId,
          createdAt: o.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * STUDENT: POST /api/v1/orders/:orderId/cancel
 * Cancel order (only while PLACED, before seller accepts).
 */
router.post(
  "/orders/:orderId/cancel",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
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
      assertTransition(order.status, "CANCELLED");
      const now = new Date();
      order.status = "CANCELLED";
      order.statusHistory.push({ status: "CANCELLED", at: now, byClerkUserId: req.user.clerkUserId });
      await order.save();
      res.json({
        success: true,
        data: { id: order._id, status: order.status },
      });
    } catch (err) {
      if (err.code === "INVALID_STATUS_TRANSITION") {
        return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
      }
      next(err);
    }
  }
);

/**
 * STUDENT: GET /api/v1/orders/:orderId
 * Own order details + status timeline (OTP not returned; shown at creation only).
 */
router.get(
  "/orders/:orderId",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["STUDENT"]),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
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
      res.json({
        success: true,
        data: {
          id: order._id,
          status: order.status,
          items: order.items,
          subtotalLkr: order.subtotalLkr,
          totalLkr: order.totalLkr,
          deliveryAddress: order.deliveryAddress,
          shopId: order.shopId,
          statusHistory: order.statusHistory,
          createdAt: order.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: GET /api/v1/seller/shops/:shopId/orders
 */
router.get(
  "/seller/shops/:shopId/orders",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { shopId } = req.params;
      if (!mongoose.isValidObjectId(shopId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid shopId" } });
      }

      const shop = await Shop.findById(shopId);
      if (!shop || shop.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your shop" } });
      }

      const orders = await Order.find({ shopId: shop._id }).sort({ createdAt: -1 }).limit(100);

      res.json({
        success: true,
        data: orders.map((o) => ({
          id: o._id,
          status: o.status,
          totalLkr: o.totalLkr,
          riderClerkUserId: o.riderClerkUserId,
          createdAt: o.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SELLER: PATCH /api/v1/seller/orders/:orderId/status
 * Allowed: PLACED->ACCEPTED->PREPARING->READY_FOR_PICKUP, and DELIVERED->COMPLETED
 */
router.patch(
  "/seller/orders/:orderId/status",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["SELLER"]),
  requireApproval(["APPROVED"]),
  validateBody(sellerStatusSchema),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { nextStatus } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid orderId" } });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      if (order.sellerClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your order" } });
      }

      // Seller can only move along strict transitions
      assertTransition(order.status, nextStatus);

      // Only seller can set COMPLETED after DELIVERED
      const now = new Date();
      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, at: now, byClerkUserId: req.user.clerkUserId });
      await order.save();

      res.json({ success: true, data: { id: order._id, status: order.status } });
    } catch (err) {
      if (err.code === "INVALID_STATUS_TRANSITION") {
        return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
      }
      next(err);
    }
  }
);

/**
 * RIDER: GET /api/v1/rider/orders/available
 * Orders ready for pickup (no rider assigned yet).
 */
router.get(
  "/rider/orders/available",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["RIDER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const orders = await Order.find({
        status: "READY_FOR_PICKUP",
        riderClerkUserId: null,
      })
        .sort({ createdAt: 1 })
        .limit(50)
        .populate("shopId", "name address phone");

      res.json({
        success: true,
        data: orders.map((o) => ({
          id: o._id,
          status: o.status,
          shopId: o.shopId?._id ?? o.shopId,
          shop: o.shopId
            ? { name: o.shopId.name, address: o.shopId.address, phone: o.shopId.phone }
            : null,
          deliveryAddress: o.deliveryAddress,
          totalLkr: o.totalLkr,
          distanceKm: o.distanceKm,
          createdAt: o.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * RIDER: GET /api/v1/rider/orders/mine
 * Rider's assigned/delivery history (must be before /:orderId).
 */
router.get(
  "/rider/orders/mine",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["RIDER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const orders = await Order.find({ riderClerkUserId: req.user.clerkUserId })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: orders.map((o) => ({
          id: o._id,
          status: o.status,
          shopId: o.shopId,
          deliveryAddress: o.deliveryAddress,
          totalLkr: o.totalLkr,
          distanceKm: o.distanceKm,
          riderFeeLkr: o.riderFeeLkr,
          createdAt: o.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * RIDER: POST /api/v1/rider/orders/:orderId/accept
 * Allowed: READY_FOR_PICKUP -> RIDER_ASSIGNED
 */
router.post(
  "/rider/orders/:orderId/accept",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["RIDER"]),
  requireApproval(["APPROVED"]),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid orderId" } });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      const riderId = req.user?.clerkUserId;
      if (!riderId) {
        return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not identified" } });
      }

      assertTransition(order.status, "RIDER_ASSIGNED");

      // assign rider
      order.riderClerkUserId = riderId;
      order.status = "RIDER_ASSIGNED";
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      order.statusHistory.push({ status: "RIDER_ASSIGNED", at: new Date(), byClerkUserId: riderId });
      await order.save();

      res.json({ success: true, data: { id: order._id, status: order.status } });
    } catch (err) {
      if (err.code === "INVALID_STATUS_TRANSITION") {
        return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
      }
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: err.message || "Validation failed" },
        });
      }
      next(err);
    }
  }
);

/**
 * RIDER: PATCH /api/v1/rider/orders/:orderId/status
 * Allowed: RIDER_ASSIGNED->PICKED_UP->ON_THE_WAY
 */
router.patch(
  "/rider/orders/:orderId/status",
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["RIDER"]),
  requireApproval(["APPROVED"]),
  validateBody(riderActionSchema),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { nextStatus } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid orderId" } });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      if (order.riderClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your order" } });
      }

      assertTransition(order.status, nextStatus);

      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, at: new Date(), byClerkUserId: req.user.clerkUserId });
      await order.save();

      res.json({ success: true, data: { id: order._id, status: order.status } });
    } catch (err) {
      if (err.code === "INVALID_STATUS_TRANSITION") {
        return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
      }
      next(err);
    }
  }
);

/**
 * RIDER: POST /api/v1/rider/orders/:orderId/deliver
 * Allowed: ON_THE_WAY -> DELIVERED (OTP verified)
 */
router.post(
  "/rider/orders/:orderId/deliver",
  otpVerifyLimiter,
  clerkAuth,
  requireAuth,
  loadUserContext,
  requireActiveUser,
  requireRole(["RIDER"]),
  requireApproval(["APPROVED"]),
  validateBody(otpVerifySchema),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { otp } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ success: false, error: { code: "INVALID_ID", message: "Invalid orderId" } });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      if (order.riderClerkUserId !== req.user.clerkUserId) {
        return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not your order" } });
      }

      assertTransition(order.status, "DELIVERED");

      if (order.otpUsedAt) {
        return res.status(400).json({
          success: false,
          error: { code: "OTP_ALREADY_USED", message: "OTP already used" },
        });
      }

      if (new Date() > order.otpExpiresAt) {
        return res.status(400).json({
          success: false,
          error: { code: "OTP_EXPIRED", message: "OTP expired" },
        });
      }

      if (order.otpAttempts >= 10) {
        return res.status(429).json({
          success: false,
          error: { code: "OTP_ATTEMPTS_EXCEEDED", message: "Too many OTP attempts" },
        });
      }

      const incomingHash = hashOtp(otp);
      const ok = incomingHash === order.otpHash;

      order.otpAttempts += 1;

      if (!ok) {
        await order.save();
        return res.status(400).json({
          success: false,
          error: { code: "OTP_INVALID", message: "Invalid OTP" },
        });
      }

      // valid OTP
      order.otpUsedAt = new Date();
      order.status = "DELIVERED";
      order.statusHistory.push({ status: "DELIVERED", at: new Date(), byClerkUserId: req.user.clerkUserId });
      await order.save();

      res.json({ success: true, data: { id: order._id, status: order.status } });
    } catch (err) {
      if (err.code === "INVALID_STATUS_TRANSITION") {
        return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
      }
      next(err);
    }
  }
);

export default router;
