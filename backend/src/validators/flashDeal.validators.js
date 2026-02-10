import { z } from "zod";

export const createFlashDealSchema = z.object({
  shopId: z.string().min(10),
  title: z.string().min(2).max(80),

  // comma list supported via frontend prompt later, but API expects array
  menuItemIds: z.array(z.string().min(10)).min(1),

  discountType: z.enum(["PERCENT", "FLAT_LKR"]),
  discountValue: z.number().min(1),

  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const updateFlashDealSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
});
