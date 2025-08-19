const Package = require('../models/package.model');

exports.addPackage = async (req, res) => {
  try {
    const { PCK_CODE, PCK_CHARGE } = req.body;
    if (!PCK_CODE || PCK_CHARGE == null) {
      return res.status(400).json({ message: 'Tên gói và charge bắt buộc' });
    }
    const newPackage = new Package({ PCK_CODE, PCK_CHARGE: parseFloat(PCK_CHARGE) }); // Parse to number
    await newPackage.save(); // Mongo unique check auto throw if trùng
    res.status(201).json({ message: 'Thêm gói cước thành công', package: newPackage });
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Gói cước đã tồn tại' });
    }
    console.error('Error adding package:', err);
    res.status(500).json({ message: 'Lỗi server', details: err.message });
  }
};