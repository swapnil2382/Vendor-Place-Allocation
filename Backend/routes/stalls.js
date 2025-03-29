// backend/routes/stalls.js
const express = require("express");
const router = express.Router();
const Stall = require("../models/Stall");

// Get all stalls
router.get("/", async (req, res) => {
  try {
    const stalls = await Stall.find();
    res.json(stalls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
