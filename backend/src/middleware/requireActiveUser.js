export function requireActiveUser(req, res, next) {
    const user = req.user;
  
    if (!user) {
      return res.status(500).json({
        success: false,
        error: { code: "USER_CONTEXT_MISSING", message: "User context not loaded" },
      });
    }
  
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: "USER_INACTIVE", message: "User is inactive" },
      });
    }
  
    next();
  }
  