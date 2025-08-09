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

// Schema cho auth (sẽ dùng sau)
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user'),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const subscriberSchema = Joi.object({
  TYPE: Joi.string().required(),
  STA_TYPE: Joi.string().required(),
  SUB_ID: Joi.string().required(),
  SUB_TYPE: Joi.string().required(),
  STA_DATE: Joi.date().required(),
  END_DATE: Joi.date().optional(),
  PROVINCE: Joi.string().required(),
  DISTRICT: Joi.string().required(),
  PCK_CODE: Joi.string().optional(),
  PCK_DATE: Joi.date().optional(),
  PCK_CHARGE: Joi.number().optional(),
});

module.exports = { filterSchema, registerSchema, loginSchema, subscriberSchema };