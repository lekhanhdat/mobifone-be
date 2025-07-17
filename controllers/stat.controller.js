const Subscriber = require("../models/subscriber.model");

exports.getSummaryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date("1900-01-01");
    const end = endDate ? new Date(endDate) : new Date();

    const total = await Subscriber.countDocuments({});
    const newSubscribers = await Subscriber.countDocuments({
      STA_DATE: { $gte: start, $lte: end }
    });
    const canceledSubscribers = await Subscriber.countDocuments({
      END_DATE: { $gte: start, $lte: end }
    });

    res.json({ total, newSubscribers, canceledSubscribers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPackageStats = async (req, res) => {
  try {
    const stats = await Subscriber.aggregate([
      {
        $group: {
          _id: "$PCK_CODE",
          totalCharge: { $sum: "$PCK_CHARGE" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalCharge: -1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGrowthTrend = async (req, res) => {
  try {
    const trend = await Subscriber.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$STA_DATE" },
            month: { $month: "$STA_DATE" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


