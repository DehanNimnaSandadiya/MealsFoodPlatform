import mongoose from "mongoose";

/**
 * V1 scope enforcement:
 * ONLY Sri Lankan Rice & Curry items are allowed (server-side).
 */
export const FOOD_SCOPE = ["SRI_LANKAN_RICE_AND_CURRY"];

// Keep categories tight for v1; expand later.
export const MENU_CATEGORIES = [
  "RICE",
  "CURRY",
  "SAMBOL",
  "SIDE",
  "ADD_ON",
  "DRINK",
];

const MenuItemSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    sellerClerkUserId: { type: String, required: true, index: true },

    // Hard enforcement
    scope: { type: String, enum: FOOD_SCOPE, required: true, default: "SRI_LANKAN_RICE_AND_CURRY" },

    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },

    category: { type: String, enum: MENU_CATEGORIES, required: true },

    priceLkr: { type: Number, required: true, min: 50, max: 50000 },
    isAvailable: { type: Boolean, required: true, default: true },

    // Optional: image later via Cloudinary
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

MenuItemSchema.index({ shopId: 1, isAvailable: 1, createdAt: -1 });
MenuItemSchema.index({ sellerClerkUserId: 1, createdAt: -1 });

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
