export function requireRole(allowedRoles) {
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      throw new Error("requireRole() needs a non-empty roles array");
    }
  
    const allowed = new Set(allowedRoles);
  
    return (req, res, next) => {
      const user = req.user;
  
      if (!user) {
        return res.status(500).json({
          success: false,
          error: { code: "USER_CONTEXT_MISSING", message: "User context not loaded" },
        });
      }
  
      if (!allowed.has(user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN_ROLE",
            message: `Requires role: ${allowedRoles.join(", ")}`,
          },
        });
      }
  
      next();
    };
  }
  