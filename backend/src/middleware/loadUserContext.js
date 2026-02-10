import { User } from "../models/User.js";

export async function loadUserContext(req, res, next) {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "No auth context" },
      });
    }

    // Bootstrap: create Mongo user if not exists
    let user = await User.findOne({ clerkUserId });
    if (!user) {
      user = await User.create({
        clerkUserId,
        role: "STUDENT",
        approvalStatus: "APPROVED",
        isActive: true,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
