// backend/seed.js
const mongoose = require("mongoose");
const Stall = require("./models/Stall");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

// Center coordinates
const centerLat = 19.066435205235848;
const centerLng = 72.99389000336194;
const metersToLatLng = (meters) => meters / 111000; // 1 degree ≈ 111km

// Ground dimensions: 50m (E-W) x 40m (N-S)
const stallSpacing = metersToLatLng(10); // 10m center-to-center (5m stall + 5m gap)
const groundWidth = metersToLatLng(50); // 50m east-west
const groundHeight = metersToLatLng(40); // 40m north-south

// Starting point (bottom-left corner, adjusted from center)
const baseLat = centerLat - groundHeight / 2; // Bottom of ground
const baseLng = centerLng - groundWidth / 2; // Left of ground

const stalls = [];
for (let i = 0; i < 4; i++) {
  // 4 rows (north-south)
  for (let j = 0; j < 5; j++) {
    // 5 columns (east-west)
    const stallNum = i * 5 + j + 1;
    stalls.push({
      name: `Stall ${stallNum}`,
      lat: baseLat + i * stallSpacing, // Move up 10m per row
      lng: baseLng + j * stallSpacing, // Move right 10m per column
      taken: Math.random() > 0.5, // Random taken status
    });
  }
}

const seedDB = async () => {
  await Stall.deleteMany({});
  await Stall.insertMany(stalls);
  console.log("Database seeded with 20 stalls based on 50m x 40m ground!");
  mongoose.connection.close();
};

seedDB();
