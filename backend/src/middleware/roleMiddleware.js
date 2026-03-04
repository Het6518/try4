exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

exports.requireClerk = (req, res, next) => {
  if (req.user.role !== "CLERK") {
    return res.status(403).json({ success: false, message: "Clerk access required." });
  }
  next();
};

exports.requireClient = (req, res, next) => {
  if (req.user.role !== "CLIENT") {
    return res.status(403).json({ success: false, message: "Client access required." });
  }
  next();
};

/** Allow any of the specified roles (pass multiple role strings). */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(", ")}.`,
    });
  }
  next();
};

/** Convenience: either CLERK or ADMIN */
exports.requireClerkOrAdmin = exports.requireRole("CLERK", "ADMIN");