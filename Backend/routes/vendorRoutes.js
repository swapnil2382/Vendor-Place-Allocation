const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const { protectVendor, protectAdmin } = require("../middleware/authMiddleware");
const twilio = require("twilio"); // Add Twilio

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
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
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
    if (!stall)
      return res
        .status(404)
        .json({ message: "No stall booked by this vendor" });

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
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

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

// Other routes (apply-license, etc.) remain unchanged for brevity
// Add them back as needed from your original code

module.exports = router;
