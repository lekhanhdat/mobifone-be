const subService = require('../services/subscriber.service');
const Subscriber = require('../models/subscriber.model');
const Package = require('../models/package.model');
const { filterSchema } = require('../utils/validation');

exports.getSummaryStats = async (req, res) => {
  try {
    const filter = req.query; // Pass all query: month, year, province, district
    const data = await subService.getSummaryStats(filter);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPackageStats = async (req, res) => {
  try {
    const { search, minCharge, hot, sortBy } = req.query; // Nếu có filter từ trước, giữ
    let effectiveSortBy = sortBy || (hot ? 'count' : 'count'); // Default sort by count desc
    if (!['count', 'avgCharge'].includes(effectiveSortBy)) effectiveSortBy = 'count';

    let pipeline = [
      { $match: { PCK_CODE: { $exists: true, $ne: '' } } }, // Filter hasPackage
      { 
        $group: { 
          _id: '$PCK_CODE', 
          count: { $sum: 1 }, 
          totalCharge: { $sum: { $toDouble: { $ifNull: ['$PCK_CHARGE', 0] } } }, 
          avgCharge: { $avg: { $toDouble: { $ifNull: ['$PCK_CHARGE', 0] } } }  // Thêm avgCharge
        } 
      },
      { $sort: { [effectiveSortBy]: -1 } } // Sort desc
    ];
    if (search) pipeline[0].$match.PCK_CODE = { ...pipeline[0].$match.PCK_CODE, $regex: search, $options: 'i' };
    if (minCharge) pipeline.push({ $match: { avgCharge: { $gte: parseFloat(minCharge) } } });

    const stats = await Subscriber.aggregate(pipeline);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPackage = async (req, res) => { // New function
  try {
    const { code, charge } = req.body;
    if (!code || !charge) return res.status(400).json({ message: 'Code và charge bắt buộc' });
    const existing = await Package.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Gói cước đã tồn tại' });
    const newPackage = new Package({ code, charge });
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', details: err.message });
  }
};

exports.getGrowthTrend = async (req, res) => {
  try {
    const { fromMonth, fromYear, toMonth, toYear, province, district } = req.query;
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0); // Default last 12
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (fromMonth && fromYear) {
      start = new Date(fromYear, fromMonth - 1, 1, 0, 0, 0); // Strict day 1 00:00
    }
    if (toMonth && toYear) {
      end = new Date(toYear, toMonth, 0, 23, 59, 59); // Strict end month 23:59
    }

    const match = { STA_DATE: { $gte: start, $lte: end, $exists: true } }; // Strict no extra
    if (province) match.PROVINCE = { $regex: province, $options: 'i' }; // Case insensitive
    if (district) match.DISTRICT = { $regex: district, $options: 'i' };

    const trend = await Subscriber.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$STA_DATE' }, month: { $month: '$STA_DATE' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { label: { $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' } ] }, count: 1, _id: 0 } },
    ]);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistribution = async (req, res) => {
  try {
    const { error } = filterSchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const provinceDist = await Subscriber.aggregate([
      { $group: { _id: '$PROVINCE', count: { $sum: 1 } } }
    ]);
    const districtDist = await Subscriber.aggregate([
      { $group: { _id: '$DISTRICT', count: { $sum: 1 } } }
    ]);
    res.json({ provinceDist, districtDist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOptions = async (req, res) => {
  try {
    const provinces = await Subscriber.aggregate([
      { $group: { _id: { $toLower: '$PROVINCE' } } },
      { $sort: { _id: 1 } },
      { $project: { value: '$_id', _id: 0 } },
    ]);
    const districts = await Subscriber.aggregate([
      { $group: { _id: { $toLower: '$DISTRICT' } } },
      { $sort: { _id: 1 } },
      { $project: { value: '$_id', _id: 0 } },
    ]);
    res.json({ provinces: provinces.map(p => p.value), districts: districts.map(d => d.value) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};