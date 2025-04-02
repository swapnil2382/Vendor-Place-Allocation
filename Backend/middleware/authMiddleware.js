// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

// Protect routes for vendors
const protectVendor = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the role is "vendor"
      if (decoded.role !== "vendor") {
        return res
          .status(403)
          .json({ message: "Not authorized, requires vendor role" });
      }

      req.vendor = await Vendor.findById(decoded.id).select("-password");
      if (!req.vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      next();
    } catch (error) {
      console.error("Vendor token verification error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

// Protect routes for admins
const protectAdmin = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the role is "admin"
      if (decoded.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Not authorized, requires admin role" });
      }

      // For admin, we don't need to fetch the model since admin authentication
      // only checks username/password against env variables
      req.admin = { role: "admin" };
      next();
    } catch (error) {
      console.error("Admin token verification error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protectVendor, protectAdmin };
