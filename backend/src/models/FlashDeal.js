import mongoose from "mongoose";

export const DISCOUNT_TYPE = ["PERCENT", "FLAT_LKR"];

const FlashDealSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    sellerClerkUserId: { type: String, required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 80 },

    // Deal targets (Phase 1: specific menu items only)
    menuItemIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    ],

    discountType: { type: String, enum: DISCOUNT_TYPE, required: true },
    discountValue: { type: Number, required: true, min: 1 },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },

    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

// Helpful indexes for finding active deals
FlashDealSchema.index({ shopId: 1, isActive: 1, startAt: 1, endAt: 1 });
FlashDealSchema.index({ isActive: 1, startAt: 1, endAt: 1 });

export const FlashDeal =
  mongoose.models.FlashDeal || mongoose.model("FlashDeal", FlashDealSchema);
