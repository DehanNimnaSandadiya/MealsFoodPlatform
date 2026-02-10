import { clerkMiddleware, getAuth } from "@clerk/express";

export const clerkAuth = clerkMiddleware();

/**
 * Adds req.auth = { userId } or returns 401
 */
export function requireAuth(req, res, next) {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing/invalid Clerk session token" },
    });
  }

  req.auth = { userId: auth.userId };
  next();
}
