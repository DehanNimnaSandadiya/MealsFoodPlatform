import mongoose from "mongoose";

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const ShopSchema = new mongoose.Schema(
  {
    sellerClerkUserId: { type: String, required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },

    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "PENDING",
      required: true,
    },

    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
    isActive: { type: Boolean, default: true, required: true },

    // Business controls (we’ll wire later)
    commissionRate: { type: Number, default: 0.1 }, // 10% monthly per shop
    aiPremiumEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShopSchema.index({ sellerClerkUserId: 1, createdAt: -1 });

export const Shop = mongoose.models.Shop || mongoose.model("Shop", ShopSchema);
