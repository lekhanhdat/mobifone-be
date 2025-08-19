const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  TYPE: { type: String, required: true }, // Bắt buộc
  STA_TYPE: { type: String, required: true }, // Bắt buộc
  SUB_ID: { type: String, required: true, unique: true }, // Bắt buộc và unique
  SUB_TYPE: { type: String, required: true }, // Bắt buộc
  STA_DATE: { type: Date, required: true }, // Bắt buộc
  END_DATE: { type: Date, required: false }, // Optional
  PROVINCE: { type: String, required: true }, // Bắt buộc
  DISTRICT: { type: String, required: true }, // Bắt buộc
  PCK_CODE: { type: String, required: false }, // Optional
  PCK_DATE: { type: Date, required: false }, // Optional
  PCK_CHARGE: { type: Number, required: false }, // Optional, dùng Number cho sum dễ
});

// Index tối ưu cho query nhanh
subscriberSchema.index({ PCK_CODE: 1, PROVINCE: 1, DISTRICT: 1 }); // Compound cho pie hasPackage + groupBy province/district
subscriberSchema.index({ STA_DATE: 1 }); // Cho trend/new subs
subscriberSchema.index({ END_DATE: 1 }); // Cho canceled
subscriberSchema.index({ SUB_TYPE: 1 });
subscriberSchema.index({ STA_TYPE: 1 });
subscriberSchema.index({ PCK_CODE: 1, PCK_CHARGE: 1 }); // Đã có, hỗ trợ $avg/$sum totalCharge/avgCharge
subscriberSchema.index({ PCK_CODE: 'text' }); // Cho search regex nhanh (text index for $regex)

module.exports = mongoose.model("Subscriber", subscriberSchema);