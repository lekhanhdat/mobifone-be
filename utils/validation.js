const Joi = require('joi');

// Schema cho filter/query chung (dùng ở getSubscribers, stats)
const filterSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(), // Giới hạn limit tránh overload
  province: Joi.string().optional(),
  district: Joi.string().optional(),
  type: Joi.string().optional(),
  staType: Joi.string().optional(),
  subType: Joi.string().optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2000).optional(),
  search: Joi.string().optional(),
  minCharge: Joi.number().min(0).optional(),
  hot: Joi.boolean().optional(),
});

// Update register schema match model (email, username, fullName, password required)
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({ 'string.email': 'Email không hợp lệ' }),
  username: Joi.string().min(3).max(30).required().messages({ 'string.min': 'Username ít nhất 3 ký tự' }),
  fullName: Joi.string().min(3).max(50).required().messages({ 'string.min': 'Full name ít nhất 3 ký tự' }),
  password: Joi.string().min(6).required().messages({ 'string.min': 'Password ít nhất 6 ký tự' }),
});

// Update login schema (identifier: email or username, password)
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({ 'any.required': 'Email hoặc username bắt buộc' }),
  password: Joi.string().required().messages({ 'any.required': 'Password bắt buộc' }),
});

const subscriberSchema = Joi.object({
  TYPE: Joi.string().required(),
  STA_TYPE: Joi.string().required(),
  SUB_ID: Joi.string().required(),
  SUB_TYPE: Joi.string().required(),
  STA_DATE: Joi.date().required(),
  END_DATE: Joi.date().allow(null, '').optional(),
  PROVINCE: Joi.string().required(),
  DISTRICT: Joi.string().required(),
  PCK_CODE: Joi.string().allow(null, '').optional(),
  PCK_DATE: Joi.date().allow(null, '').optional(),
  PCK_CHARGE: Joi.number().allow(null, '').optional(),
});

module.exports = { filterSchema, registerSchema, loginSchema, subscriberSchema };