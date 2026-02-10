import { z } from "zod";

export const setApprovalSchema = z.object({
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]),
  rejectionReason: z.string().max(500).optional(),
});
