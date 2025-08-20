const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
}, { timestamps: true });

// Index tối ưu cho query login (email or username)
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1, username: 1 });

userSchema.pre('save', async function(next) {
  if (this.isModified('email')) this.email = this.email.toLowerCase();  // Lowercase email if changed
  if (this.isModified('username')) this.username = this.username.toLowerCase();  // Lowercase username if changed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method so sánh password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);