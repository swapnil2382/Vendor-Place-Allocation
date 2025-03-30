const mongoose = require('mongoose');

const MarketplaceSchema = new mongoose.Schema({
   spotID: { type: String, unique: true },
   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
   location: String,
   isOccupied: { type: Boolean, default: false }
});

module.exports = mongoose.model('Marketplace', MarketplaceSchema);
