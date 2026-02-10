export function requireApproval(allowedStatuses) {
    if (!Array.isArray(allowedStatuses) || allowedStatuses.length === 0) {
      throw new Error("requireApproval() needs a non-empty statuses array");
    }
  
    const allowed = new Set(allowedStatuses);
  
    return (req, res, next) => {
      const user = req.user;
  
      if (!user) {
        return res.status(500).json({
          success: false,
          error: { code: "USER_CONTEXT_MISSING", message: "User context not loaded" },
        });
      }
  
      if (!allowed.has(user.approvalStatus)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN_APPROVAL",
            message: `Requires approval status: ${allowedStatuses.join(", ")}`,
          },
        });
      }
  
      next();
    };
  }
  