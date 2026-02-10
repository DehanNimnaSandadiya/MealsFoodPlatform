import mongoose from "mongoose";

const COMPLAINT_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const ComplaintSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    studentClerkUserId: { type: String, required: true, index: true },
    targetType: { type: String, enum: ["SELLER", "RIDER", "ORDER"], default: "ORDER", required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: COMPLAINT_STATUS, default: "OPEN", required: true, index: true },
    resolutionNotes: { type: String, trim: true, maxlength: 500, default: "" },
    resolvedAt: { type: Date, default: null },
    resolvedByClerkUserId: { type: String, default: null },
  },
  { timestamps: true }
);

ComplaintSchema.index({ status: 1, createdAt: -1 });

export const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
