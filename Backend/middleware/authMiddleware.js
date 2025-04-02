// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Vendor = require("../models/Vendor");


const authenticate = async (req, res, next, Model, role) => {
  let token;

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    console.log(`No token provided for ${role}`);
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    token = req.headers.authorization.split(" ")[1];
    console.log(`Authenticating ${role} with token:`, token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    if (decoded.role !== role) {
      console.log(
        `Token role (${decoded.role}) does not match expected role (${role})`
      );
      return res.status(403).json({ message: `Not authorized as ${role}` });
    }

    if (role === "admin") {
      // Admin doesn’t require a model lookup since it’s hardcoded
      req.admin = { role: "admin" };
      console.log("Admin authenticated (hardcoded)");
      next();
    } else {
      // Fetch user or vendor from database
      const entity = await Model.findById(decoded.id).select("-password");
      if (!entity) {
        console.log(`No ${role} found with id: ${decoded.id}`);
        return res.status(401).json({ message: `Not authorized as ${role}` });
      }
      req[role] = entity;
      console.log(`${role} authenticated:`, req[role]._id);
      next();
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.error(`Token expired for ${role}:`, error.message);
      return res.status(401).json({ message: "Not authorized, token expired" });
    } else if (error.name === "JsonWebTokenError") {
      console.error(`Invalid token for ${role}:`, error.message);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    } else {
      console.error(`Token validation failed for ${role}:`, error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
};

const protectUser = (req, res, next) =>
  authenticate(req, res, next, User, "user");
const protectVendor = (req, res, next) =>
  authenticate(req, res, next, Vendor, "vendor");
const protectAdmin = (req, res, next) =>
  authenticate(req, res, next, null, "admin");

module.exports = { protectUser, protectVendor, protectAdmin };
