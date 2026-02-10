import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().min(2).max(80),
  address: z.string().min(5).max(200),
  phone: z.string().min(7).max(30),
});
