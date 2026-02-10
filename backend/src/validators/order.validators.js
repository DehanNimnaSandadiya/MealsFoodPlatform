import { z } from "zod";

export const placeOrderSchema = z
  .object({
    shopId: z.string().min(10),
    deliveryAddress: z.string().min(5).max(300).optional(),
    addressId: z.string().min(10).optional(),
    distanceKm: z.number().min(0).max(200),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(10),
          qty: z.number().int().min(1).max(50),
        })
      )
      .min(1),
  })
  .refine((data) => data.deliveryAddress ?? data.addressId, {
    message: "Either deliveryAddress or addressId is required",
    path: ["deliveryAddress"],
  });

export const sellerStatusSchema = z.object({
  nextStatus: z.enum(["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"]),
});

export const riderActionSchema = z.object({
  nextStatus: z.enum(["PICKED_UP", "ON_THE_WAY"]),
});

export const otpVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
