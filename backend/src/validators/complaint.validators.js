import { z } from "zod";

export const createComplaintSchema = z.object({
  orderId: z.string().min(10),
  targetType: z.enum(["SELLER", "RIDER", "ORDER"]).optional(),
  message: z.string().min(5).max(1000),
});

export const updateComplaintSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  resolutionNotes: z.string().max(500).optional(),
});
