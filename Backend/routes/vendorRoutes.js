// backend/routes/vendorRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectUser, protectVendor, protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Set up file uploads configuration
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    console.log("Generated filename:", filename);
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Get logged-in vendor details
router.get("/me", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select("-password");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    console.log("Returning vendor data:", vendor);
    res.json(vendor);
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Claim a stall
router.post("/claim-stall/:stallId", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const stall = await Stall.findById(req.params.stallId);
    if (!stall) return res.status(404).json({ message: "Stall not found" });
    if (stall.taken)
      return res.status(400).json({ message: "Stall already taken" });

    const existingStall = await Stall.findOne({
      vendorID: vendor._id,
      taken: true,
    });

    if (existingStall) {
      return res.status(400).json({
        message:
          "You already have a stall booked. Please unbook your current stall before booking a new one.",
        currentStall: {
          id: existingStall._id,
          name: existingStall.name,
          lat: existingStall.lat,
          lng: existingStall.lng,
        },
      });
    }

    stall.taken = true;
    stall.vendorID = vendor._id;
    await stall.save();

    vendor.gpsCoordinates = `${stall.lat},${stall.lng}`;
    await vendor.save();

    console.log("Vendor updated with gpsCoordinates:", vendor.gpsCoordinates);

    res.json({
      message: "Stall booked successfully",
      stall: {
        name: stall.name,
        lat: stall.lat,
        lng: stall.lng,
        vendorID: stall.vendorID,
      },
    });
  } catch (error) {
    console.error("Error in /claim-stall:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Unbook a stall
router.post("/unbook-stall", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const stall = await Stall.findOne({ vendorID: vendor._id, taken: true });
    if (!stall) {
      return res.status(404).json({ message: "No stall booked by this vendor" });
    }

    stall.taken = false;
    stall.vendorID = null;
    await stall.save();

    vendor.gpsCoordinates = null;
    await vendor.save();

    console.log("Stall unbooked for vendor:", vendor._id);

    res.json({ message: "Stall unbooked successfully" });
  } catch (error) {
    console.error("Error in /unbook-stall:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark vendor attendance
router.post("/mark-attendance", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.lastAttendance = new Date();
    await vendor.save();

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error in /mark-attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Apply for Business License
router.post(
  "/apply-license",
  protectVendor,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "vendorPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📩 Incoming License Application Request:", req.body);
      console.log("📂 Uploaded Files:", req.files);

      const { aadhaarID, panNumber, businessName, gstNumber, yearsInBusiness, businessDescription } = req.body;

      if (!aadhaarID || !panNumber || !businessName) {
        return res.status(400).json({
          message: "❌ Aadhaar ID, PAN Number, and Business Name are required.",
        });
      }

      if (!req.files || !req.files.shopPhoto || !req.files.vendorPhoto) {
        return res.status(400).json({ message: "❌ Both shopPhoto and vendorPhoto are required." });
      }

      const shopPhotoUrl = `http://localhost:5000/uploads/${req.files.shopPhoto[0].filename}`;
      const vendorPhotoUrl = `http://localhost:5000/uploads/${req.files.vendorPhoto[0].filename}`;

      const vendor = await Vendor.findById(req.vendor.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      vendor.panNumber = panNumber;
      vendor.businessName = businessName;
      vendor.license = {
        status: "requested",
        documents: {
          aadhaarID,
          panNumber,
          businessName,
          gstNumber: gstNumber || "",
          yearsInBusiness: Number(yearsInBusiness) || 0,
          businessDescription: businessDescription || "",
          shopPhoto: shopPhotoUrl,
          vendorPhoto: vendorPhotoUrl,
        },
        appliedAt: new Date(),
      };

      await vendor.save();
      res.json({
        message: "✅ License application submitted successfully.",
        status: "requested",
      });
    } catch (error) {
      console.error("❌ Server Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Admin Approves License
router.post(
  "/admin/approve-license/:vendorId",
  protectAdmin,
  async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.params.vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      vendor.license.status = "completed";
      vendor.license.approvedAt = new Date();
      vendor.license.licenseNumber = `LIC-${vendor.shopID}-${Date.now()}`;
      await vendor.save();

      res.json({
        message: "✅ License approved successfully.",
        status: "completed",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update vendor location
router.put("/update-location", protectVendor, async (req, res) => {
  try {
    const { location } = req.body;
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: "Location (latitude & longitude) is required." });
    }

    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found." });

    vendor.location = `${location.latitude},${location.longitude}`;
    vendor.gpsLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    await vendor.save();
    res.json({ message: "Location updated successfully", vendor });
  } catch (error) {
    console.error("Error in /update-location:", error);
    res.status(500).json({ error: "Internal Server Error", error: error.message });
  }
});

// Get all active vendors for marketplace
router.get("/marketplace", async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).select("name category location shopID");
    res.json(vendors);
  } catch (error) {
    console.error("Error in /marketplace:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Complete vendor profile
router.put("/complete-profile", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    Object.assign(vendor, req.body, { isProfileComplete: true });
    await vendor.save();

    res.json({ message: "Profile updated successfully", vendor });
  } catch (error) {
    console.error("Error in /complete-profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.post(
  "/add-product",
  protectVendor,
  upload.fields([{ name: "productImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Uploaded files:", req.files);

      const { name, description, price, category, stock } = req.body;
      const vendor = await Vendor.findById(req.vendor.id);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      console.log("Vendor before update:", vendor);

      if (!name || !price || !category) {
        return res.status(400).json({
          message: "Name, price, and category are required",
        });
      }

      const priceNum = Number(price);
      if (isNaN(priceNum)) {
        return res.status(400).json({ message: "Price must be a valid number" });
      }

      const stockNum = stock ? Number(stock) : 0;
      if (stock && isNaN(stockNum)) {
        return res.status(400).json({ message: "Stock must be a valid number" });
      }

      const productImage = req.files && req.files.productImage
        ? `http://localhost:5000/uploads/${req.files.productImage[0].filename}`
        : "";

      const product = {
        name,
        image: productImage,
        description: description || "",
        price: priceNum,
        category,
        stock: stockNum,
        createdAt: new Date(),
      };

      // Fallback fix for location
      if (vendor.location && typeof vendor.location === 'object') {
        vendor.location = `${vendor.location.latitude || "0"},${vendor.location.longitude || "0"}`;
    } else if (!vendor.location) {
        vendor.location = "0,0";  // Default if location is missing
    }
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
  }
  console.log("Final vendor location:", vendor.location);
  
    

      vendor.products.push(product);
      await vendor.save();

      console.log("Vendor after save:", vendor);

      res.json({
        message: "Product added successfully",
        product,
      });
    } catch (error) {
      console.error("Error in /add-product:", error.stack);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get all vendor products
router.get("/products", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor.products);
  } catch (error) {
    console.error("Error in /products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// Update product
router.put("/update-product/:productId", protectVendor, async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const product = vendor.products.id(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    await vendor.save();
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error in /update-product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete product
router.delete("/delete-product/:productId", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const product = vendor.products.id(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    vendor.products.pull(req.params.productId);
    await vendor.save();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in /delete-product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/orders", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).populate("orders.userId", "username email");
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor.orders);
  } catch (error) {
    console.error("Error in /vendors/orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.put("/orders/:orderId/complete", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const order = vendor.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Order already completed" });
    }

    const product = vendor.products.id(order.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < order.quantity) {
      return res.status(400).json({ message: "Insufficient stock to complete order" });
    }

    product.stock -= order.quantity; // Decrease stock here
    order.status = "Completed";
    await vendor.save();

    res.json({ message: "Order marked as completed", order });
  } catch (error) {
    console.error("Error in /vendors/orders/:orderId/complete:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;