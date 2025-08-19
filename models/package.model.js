const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  PCK_CODE: { type: String, required: true, unique: true },
  PCK_CHARGE: { type: Number, required: true } 
});

// Index tối ưu cho lookup/sort
packageSchema.index({ PCK_CODE: 1 });
packageSchema.index({ PCK_CHARGE: 1 }); 

module.exports = mongoose.model("Package", packageSchema);