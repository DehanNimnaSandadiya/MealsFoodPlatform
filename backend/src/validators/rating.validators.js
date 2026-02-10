import { z } from "zod";

export const createRatingSchema = z.object({
  orderId: z.string().min(10),
  sellerRating: z.number().int().min(1).max(5),
  riderRating: z.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().max(500).optional(),
});
