const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  PROVINCE: { type: String, required: true },
  DISTRICT: { type: String, required: true },
  FULL_NAME: { type: String, required: true },
});

// Index compound unique
districtSchema.index({ PROVINCE: 1, DISTRICT: 1 }, { unique: true });

module.exports = mongoose.model('District', districtSchema);