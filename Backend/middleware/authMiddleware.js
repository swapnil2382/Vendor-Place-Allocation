// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Admin = require("../models/Admin");

const authenticate = async (req, res, next, Model, role) => {
  let token;

  // Check for token in Authorization header
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
    console.log(`No token provided for ${role}`);
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Extract token
    token = req.headers.authorization.split(" ")[1];
    console.log(`Authenticating ${role} with token:`, token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Check if token role matches expected role
    if (decoded.role !== role) {
      console.log(`Token role (${decoded.role}) does not match expected role (${role})`);
      return res.status(403).json({ message: `Not authorized as ${role}` });
    }

    // Fetch the entity from the database
    const entity = await Model.findById(decoded.id).select("-password");
    if (!entity) {
      console.log(`No ${role} found with id: ${decoded.id}`);
      return res.status(401).json({ message: `Not authorized as ${role}` });
    }

    // Assign to req with consistent naming
    req[role] = entity;
    console.log(`${role} authenticated:`, req[role]._id);
    next();
  } catch (error) {
    // Handle specific JWT errors
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

const protectUser = (req, res, next) => authenticate(req, res, next, User, "user");
const protectVendor = (req, res, next) => authenticate(req, res, next, Vendor, "vendor");
const protectAdmin = (req, res, next) => authenticate(req, res, next, Admin, "admin");

module.exports = { protectUser, protectVendor, protectAdmin };