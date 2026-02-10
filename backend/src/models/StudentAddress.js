import mongoose from "mongoose";

const StudentAddressSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, required: true, index: true },
    label: { type: String, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// At most one default per user
StudentAddressSchema.index({ clerkUserId: 1, isDefault: 1 }, { partialFilterExpression: { isDefault: true } });

export const StudentAddress = mongoose.model("StudentAddress", StudentAddressSchema);
