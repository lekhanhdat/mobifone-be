// sub_type.model.js
const mongoose = require('mongoose');

const subTypeSchema = new mongoose.Schema({
  SUB_TYPE: { type: String, unique: true, required: true },
  NAME: { type: String, required: true } // Optional nếu CSV có empty
});

module.exports = mongoose.model('SubType', subTypeSchema);