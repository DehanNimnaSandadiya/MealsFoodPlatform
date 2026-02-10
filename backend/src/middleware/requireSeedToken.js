export function requireSeedToken(req, res, next) {
    // Never allow this in production
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Route not found" },
      });
    }
  
    const expected = process.env.ADMIN_SEED_TOKEN;
    if (!expected) {
      return res.status(500).json({
        success: false,
        error: { code: "MISCONFIGURED", message: "Missing ADMIN_SEED_TOKEN" },
      });
    }
  
    const provided = req.header("x-admin-seed-token");
    if (!provided || provided !== expected) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Invalid seed token" },
      });
    }
  
    next();
  }
  