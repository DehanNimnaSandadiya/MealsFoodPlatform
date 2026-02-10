import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    studentClerkUserId: { type: String, required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    sellerClerkUserId: { type: String, required: true, index: true },
    riderClerkUserId: { type: String, default: null, index: true },

    sellerRating: { type: Number, required: true, min: 1, max: 5 },
    riderRating: { type: Number, default: null, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

RatingSchema.index({ shopId: 1, createdAt: -1 });

export const Rating = mongoose.models.Rating || mongoose.model("Rating", RatingSchema);
