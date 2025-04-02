// backend/fixVendorLocation.js
require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

console.log('MONGO_URI:', process.env.MONGO_URI); // Debug to confirm URI is loaded

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');

  // Find vendors with location as an object
  const vendors = await Vendor.find({ "location.latitude": { $exists: true } });
  console.log(`Found ${vendors.length} vendors with object-type location`);

  for (const vendor of vendors) {
    const { latitude, longitude } = vendor.location;
    if (latitude && longitude) {
      vendor.location = `${latitude},${longitude}`;
      vendor.gpsLocation = { latitude, longitude };
      await vendor.save();
      console.log(`Updated vendor ${vendor._id}: location set to "${vendor.location}"`);
    } else {
      console.log(`Vendor ${vendor._id} has invalid location data:`, vendor.location);
    }
  }

  // Verify all vendors have string location
  const invalidVendors = await Vendor.find({ "location.latitude": { $exists: true } });
  if (invalidVendors.length === 0) {
    console.log('Migration complete: All locations are strings');
  } else {
    console.log('Remaining invalid vendors:', invalidVendors.length);
    invalidVendors.forEach(v => console.log(v._id, v.location));
  }

  mongoose.disconnect();
}).catch(err => console.error('Migration error:', err));