const { registerSchema, loginSchema } = require('../utils/validation');
const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);  // Validate body
    if (error) return res.status(400).json({ message: error.details[0].message });  // Return error message clean
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Đăng ký thành công', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);  // Validate body
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { identifier, password } = req.body;
    const { token, user } = await authService.login(identifier, password);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};