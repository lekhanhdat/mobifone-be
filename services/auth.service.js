const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
  const { email, username, password, fullName } = data;
  if (!email || !username || !password || !fullName) throw new Error('Tất cả fields bắt buộc');
  const existingEmail = await User.findOne({ email }).lean();
  if (existingEmail) throw new Error('Email đã tồn tại');
  const existingUsername = await User.findOne({ username }).lean();
  if (existingUsername) throw new Error('Username đã tồn tại');
  const user = new User({ email, username, password, fullName });
  await user.save();
  return user;
};

exports.login = async (identifier, password) => {
  const lowerIdentifier = identifier.toLowerCase();  // Case-insensitive
  const user = await User.findOne({
    $or: [
      { email: { $regex: new RegExp(`^${lowerIdentifier}$`, 'i') } },
      { username: { $regex: new RegExp(`^${lowerIdentifier}$`, 'i') } }
    ]
  });
  if (!user) throw new Error('User không tồn tại');
  const isMatch = await user.comparePassword(password);  // Gọi instance method, fix "bcrypt not defined"
  if (!isMatch) throw new Error('Mật khẩu sai');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token, user: { email: user.email, username: user.username, fullName: user.fullName } };
};