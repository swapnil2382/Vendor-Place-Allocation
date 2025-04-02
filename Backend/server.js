// backend/server.js
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const stallRoutes = require("./routes/stalls");
const vendorRoutes = require("./routes/vendorRoutes"); // Ensure this matches the filename
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");





dotenv.config();

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors());
app.use(express.json());

app.use("/api/stalls", stallRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
