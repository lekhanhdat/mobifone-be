// sta_type.model.js
const mongoose = require('mongoose');

const staTypeSchema = new mongoose.Schema({
  STA_TYPE: { type: String, unique: true, required: true },
  NAME: { type: String, required: true } // Optional
});

module.exports = mongoose.model('StaType', staTypeSchema);