const subService = require('../services/subscriber.service');
const { filterSchema } = require('../utils/validation');

exports.getSummaryStats = async (req, res) => {
  try {
    const { month, year, province, district } = req.query;
    const filter = {};
    if (province) filter.PROVINCE = province;
    if (district) filter.DISTRICT = district;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      filter.STA_DATE = { $gte: start, $lte: end }; // Example for new
    }
    const data = await subService.getSummaryStats(filter);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPackageStats = async (req, res) => {
  try {
    const { search, minCharge, hot } = req.query;
    let pipeline = [
      { $group: { _id: '$PCK_CODE', count: { $sum: 1 }, totalCharge: { $sum: '$PCK_CHARGE' }, avgCharge: { $avg: '$PCK_CHARGE' } } },
      { $sort: { count: -1 } }
    ];
    if (search) pipeline.unshift({ $match: { PCK_CODE: { $regex: search, $options: 'i' } } });
    if (minCharge) pipeline.push({ $match: { avgCharge: { $gte: parseFloat(minCharge) } } });
    if (hot) pipeline[pipeline.length - 1].$sort = { count: -1 }; // Already hot
    const stats = await Subscriber.aggregate(pipeline);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGrowthTrend = async (req, res) => {
  try {
    const { month, year, province, district } = req.query;
    const match = {};
    if (province) match.PROVINCE = province;
    if (district) match.DISTRICT = district;
    if (month && year) {
      match.STA_DATE = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    }
    const trend = await Subscriber.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: '$STA_DATE' }, month: { $month: '$STA_DATE' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistribution = async (req, res) => {
  try {
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