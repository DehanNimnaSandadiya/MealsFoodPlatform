import mongoose from "mongoose";

export const ORDER_STATUS = [
  "PLACED",
  "CANCELLED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "COMPLETED",
];

const OrderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true },
    priceLkrSnapshot: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1, max: 50 },
    lineTotalLkr: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    studentClerkUserId: { type: String, required: true, index: true },
    sellerClerkUserId: { type: String, required: true, index: true },
    riderClerkUserId: { type: String, default: null, index: true },

    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },

    status: { type: String, enum: ORDER_STATUS, required: true, default: "PLACED", index: true },

    items: { type: [OrderItemSchema], required: true, validate: (v) => v.length > 0 },

    currency: { type: String, default: "LKR" },

    subtotalLkr: { type: Number, required: true },
    commissionRate: { type: Number, required: true, default: 0.1 },
    commissionAmountLkr: { type: Number, required: true },
    totalLkr: { type: Number, required: true },

    // Rider fee (paid by seller): 25 LKR per 1 km (recorded)
    distanceKm: { type: Number, required: true, min: 0, max: 200 },
    riderFeePerKmLkr: { type: Number, required: true, default: 25 },
    riderFeeLkr: { type: Number, required: true },

    deliveryAddress: { type: String, required: true, trim: true, maxlength: 300 },

    // OTP delivery verification (stored hashed)
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpUsedAt: { type: Date, default: null },
    otpAttempts: { type: Number, required: true, default: 0 },

    // Timestamps for auditing
    statusHistory: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUS, required: true },
          at: { type: Date, required: true },
          byClerkUserId: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

OrderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ studentClerkUserId: 1, createdAt: -1 });
OrderSchema.index({ sellerClerkUserId: 1, createdAt: -1 });
OrderSchema.index({ riderClerkUserId: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
