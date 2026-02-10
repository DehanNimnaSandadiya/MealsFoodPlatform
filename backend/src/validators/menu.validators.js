import { z } from "zod";

const MENU_CATEGORIES = ["RICE", "CURRY", "SAMBOL", "SIDE", "ADD_ON", "DRINK"];

export const createMenuItemSchema = z.object({
  // scope is NOT accepted from client (server forces it)
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  category: z.enum(MENU_CATEGORIES),
  priceLkr: z.number().int().min(50).max(50000),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  category: z.enum(MENU_CATEGORIES).optional(),
  priceLkr: z.number().int().min(50).max(50000).optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

