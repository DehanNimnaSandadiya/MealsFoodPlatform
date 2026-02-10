import mongoose from "mongoose";

export const USER_ROLES = ["STUDENT", "SELLER", "RIDER", "ADMIN"];
export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const UserSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },

    // App-level RBAC role (server-enforced)
    role: { type: String, enum: USER_ROLES, default: "STUDENT", required: true },

    // Approval status is meaningful for SELLER/RIDER/Admin-managed entities
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "APPROVED", // Students are effectively approved by default in v1 onboarding
      required: true,
    },

    isActive: { type: Boolean, default: true, required: true },

    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
