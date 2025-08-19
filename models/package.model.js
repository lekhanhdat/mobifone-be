const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Tên gói, unique
  charge: { type: Number, required: true }, // Giá fixed
});

// Index cho query nhanh
packageSchema.index({ code: 1 }); // Unique đã implicit index

module.exports = mongoose.model("Package", packageSchema);