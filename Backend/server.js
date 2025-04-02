require("dotenv").config(); // Load environment variables first
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const stallRoutes = require("./routes/stalls");
const vendorRoutes = require("./routes/vendorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create directories for static files
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");
const uploadsDir = path.join(__dirname, "uploads");

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err);
    }
  }
};

[publicDir, imagesDir, uploadsDir].forEach(ensureDirectoryExists);

// Create placeholder images
const placeholderPath = path.join(imagesDir, "placeholder.png");
const govtEmblemPath = path.join(imagesDir, "govt-emblem.png");
const officialSealPath = path.join(imagesDir, "official-seal.png");

// Minimal 1x1 transparent PNG (base64 encoded)
const minimalPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const createBasicImageIfNeeded = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating ${label} image at ${filePath}`);
    try {
      fs.writeFileSync(filePath, minimalPNG);
      console.log(`Created ${label} image at ${filePath}`);
    } catch (error) {
      console.error(`Failed to create ${label} image at ${filePath}:`, error);
    }
  }
};

createBasicImageIfNeeded(placeholderPath, "placeholder");
createBasicImageIfNeeded(govtEmblemPath, "government emblem");
createBasicImageIfNeeded(officialSealPath, "official seal");

// Serve static files
app.use("/uploads", express.static(uploadsDir));
app.use("/images", express.static(imagesDir));
app.use("/public", express.static(publicDir));

// Connect to MongoDB first
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Set up API routes after successful database connection
    app.use("/api/stalls", stallRoutes);
    app.use("/api/vendors", vendorRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
