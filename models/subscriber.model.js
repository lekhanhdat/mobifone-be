const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  TYPE: String,
  STA_TYPE: String,
  SUB_ID: String,
  SUB_TYPE: String,
  STA_DATE: Date,
  END_DATE: Date,
  PROVINCE: String,
  DISTRICT: String,
  PCK_CODE: String,
  PCK_DATE: Date,
  PCK_CHARGE: Number,
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
