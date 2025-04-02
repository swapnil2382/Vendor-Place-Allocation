const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const twilio = require("twilio"); // Add Twilio
const {
  protectUser,
  protectVendor,
  protectAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Twilio configuration (load from .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

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
    res.json(vendor);
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Claim a stall (requires payment confirmation)
router.post("/claim-stall/:stallId", protectVendor, async (req, res) => {
  try {
    const { paymentConfirmed } = req.body;
    if (!paymentConfirmed) {
      return res.status(400).json({ message: "Payment confirmation required" });
    }

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
        message: "You already have a stall booked. Please unbook it first.",
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
    stall.bookingTime = new Date(); // Set booking time
    await stall.save();

    vendor.gpsCoordinates = `${stall.lat},${stall.lng}`;
    await vendor.save();

    // Schedule SMS reminder 23 hours and 55 minutes from now (5 minutes before 24-hour deadline)
    const bookingTime = new Date(stall.bookingTime);
    const reminderTime = new Date(
      bookingTime.getTime() + 23 * 60 * 60 * 1000 + 55 * 60 * 1000
    );
    const now = new Date();
    const delay = reminderTime - now;

    if (delay > 0) {
      setTimeout(async () => {
        const updatedVendor = await Vendor.findById(vendor._id);
        const updatedStall = await Stall.findById(stall._id);
        if (
          updatedStall.taken &&
          (!updatedVendor.lastAttendance ||
            new Date(updatedVendor.lastAttendance) < bookingTime)
        ) {
          try {
            await client.messages.create({
              body: `Reminder: You have 5 minutes left to mark attendance for stall ${stall.name}. Otherwise, it will be released.`,
              from: twilioPhone,
              to: updatedVendor.phoneNumber,
            });
            console.log(`SMS sent to ${updatedVendor.phoneNumber}`);
          } catch (smsError) {
            console.error("Error sending SMS:", smsError);
          }
        }
      }, delay);
    }

    res.json({
      message: "Stall booked successfully",
      stall: {
        name: stall.name,
        lat: stall.lat,
        lng: stall.lng,
        vendorID: stall.vendorID,
        bookingTime: stall.bookingTime,
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
      return res
        .status(404)
        .json({ message: "No stall booked by this vendor" });
    }

    stall.taken = false;
    stall.vendorID = null;
    stall.bookingTime = null;
    await stall.save();

    vendor.gpsCoordinates = null;
    await vendor.save();

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

    const stall = await Stall.findOne({ vendorID: vendor._id, taken: true });
    if (!stall) return res.status(404).json({ message: "No stall booked" });

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

      const {
        aadhaarID,
        panNumber,
        businessName,
        gstNumber,
        yearsInBusiness,
        businessDescription,
      } = req.body;

      if (!aadhaarID || !panNumber || !businessName) {
        return res.status(400).json({
          message: "❌ Aadhaar ID, PAN Number, and Business Name are required.",
        });
      }

      if (!req.files || !req.files.shopPhoto || !req.files.vendorPhoto) {
        return res
          .status(400)
          .json({ message: "❌ Both shopPhoto and vendorPhoto are required." });
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
      return res
        .status(400)
        .json({ error: "Location (latitude & longitude) is required." });
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
    res
      .status(500)
      .json({ error: "Internal Server Error", error: error.message });
  }
});

// Get all active vendors for marketplace
router.get("/marketplace", async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).select(
      "name category location shopID"
    );
    res.json(vendors);
  } catch (error) {
    console.error("Error in /marketplace:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.put(
  "/complete-profile",
  protectVendor,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "vendorPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Request body:", req.body); // Debug
      console.log("Uploaded files:", req.files); // Debug

      const vendor = await Vendor.findById(req.vendor.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Destructure fields from req.body with default empty strings to avoid undefined
      const {
        businessName = "",
        businessDescription = "",
        alternateContact = "",
        gstNumber = "",
        panNumber = "",
        yearsInBusiness = "",
        preferredMarketArea = "",
        gpsCoordinates = "",
        spotType = "",
        alternateSpot = "",
        productsSold = "",
        dailyStock = "",
        peakSellingHours = "",
        priceRange = "",
        hasTradeLicense = "false", // Default to string "false" for checkbox
        requiresStorage = "false", // Default to string "false" for checkbox
        emergencyContact = "",
      } = req.body;

      // Update text fields only if provided (preserve existing values otherwise)
      vendor.businessName = businessName || vendor.businessName;
      vendor.businessDescription = businessDescription || vendor.businessDescription;
      vendor.alternateContact = alternateContact || vendor.alternateContact;
      vendor.gstNumber = gstNumber || vendor.gstNumber;
      vendor.panNumber = panNumber || vendor.panNumber;
      vendor.yearsInBusiness = yearsInBusiness
        ? Number(yearsInBusiness)
        : vendor.yearsInBusiness;
      vendor.preferredMarketArea = preferredMarketArea || vendor.preferredMarketArea;
      vendor.gpsCoordinates = gpsCoordinates || vendor.gpsCoordinates;
      vendor.spotType = spotType || vendor.spotType;
      vendor.alternateSpot = alternateSpot || vendor.alternateSpot;
      vendor.dailyStock = dailyStock ? Number(dailyStock) : vendor.dailyStock;
      vendor.peakSellingHours = peakSellingHours || vendor.peakSellingHours;
      vendor.priceRange = priceRange || vendor.priceRange;
      vendor.hasTradeLicense =
        hasTradeLicense === "true" ? true : hasTradeLicense === "false" ? false : vendor.hasTradeLicense;
      vendor.requiresStorage =
        requiresStorage === "true" ? true : requiresStorage === "false" ? false : vendor.requiresStorage;
      vendor.emergencyContact = emergencyContact || vendor.emergencyContact;

      // Set isProfileComplete to true only if key fields are provided
      vendor.isProfileComplete = !!(
        vendor.businessName &&
        vendor.panNumber &&
        vendor.category // Assuming category is required from schema
      );

      // Handle productsSold as a comma-separated string
      if (productsSold) {
        const productsArray = productsSold
          .split(",")
          .map((name) => ({
            name: name.trim(),
            price: 0, // Default price (could be made configurable)
            category: "Uncategorized", // Default category (could be made configurable)
            stock: 0, // Default stock
            createdAt: new Date(),
          }))
          .filter((product) => product.name); // Filter out empty names
        vendor.products = productsArray.length > 0 ? productsArray : vendor.products;
      }

      // Handle image uploads
      if (req.files) {
        if (req.files.shopPhoto) {
          const shopPhotoUrl = `http://localhost:5000/uploads/${req.files.shopPhoto[0].filename}`;
          vendor.shopPhoto = shopPhotoUrl;
          console.log("Updated shopPhoto:", shopPhotoUrl); // Debug
        }
        if (req.files.vendorPhoto) {
          const vendorPhotoUrl = `http://localhost:5000/uploads/${req.files.vendorPhoto[0].filename}`;
          vendor.vendorPhoto = vendorPhotoUrl;
          console.log("Updated vendorPhoto:", vendorPhotoUrl); // Debug
        }
      }

      // Save the updated vendor document
      await vendor.save();

      // Return the updated vendor data
      res.json({
        message: "Profile updated successfully",
        vendor: vendor.toJSON(), // Ensure all fields are serialized
      });
    } catch (error) {
      console.error("Error in /complete-profile:", error.stack); // Include stack trace for better debugging
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
);
// Check and reset expired stalls (run periodically via cron or manually)
router.post("/check-expired-stalls", protectVendor, async (req, res) => {
  try {
    const stalls = await Stall.find({
      taken: true,
      bookingTime: { $ne: null },
    });
    const now = new Date();

    for (const stall of stalls) {
      const bookingTime = new Date(stall.bookingTime);
      const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      if (now > deadline) {
        const vendor = await Vendor.findById(stall.vendorID);
        if (
          vendor &&
          (!vendor.lastAttendance ||
            new Date(vendor.lastAttendance) < bookingTime)
        ) {
          stall.taken = false;
          stall.vendorID = null;
          stall.bookingTime = null;
          await stall.save();
          vendor.gpsCoordinates = null;
          await vendor.save();
          console.log(`Stall ${stall.name} reset due to expired timer`);
        }
      }
    }
    res.json({ message: "Expired stalls checked and reset" });
  } catch (error) {
    console.error("Error in /check-expired-stalls:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add product
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
        return res
          .status(400)
          .json({ message: "Price must be a valid number" });
      }

      const stockNum = stock ? Number(stock) : 0;
      if (stock && isNaN(stockNum)) {
        return res
          .status(400)
          .json({ message: "Stock must be a valid number" });
      }

      const productImage =
        req.files && req.files.productImage
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
      if (vendor.location && typeof vendor.location === "object") {
        vendor.location = `${vendor.location.latitude || "0"},${
          vendor.location.longitude || "0"
        }`;
      } else if (!vendor.location) {
        vendor.location = "0,0"; // Default if location is missing
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

// Get all vendor orders
router.get("/orders", protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).populate(
      "orders.userId",
      "username email"
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor.orders);
  } catch (error) {
    console.error("Error in /vendors/orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Complete an order
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
      return res
        .status(400)
        .json({ message: "Insufficient stock to complete order" });
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
