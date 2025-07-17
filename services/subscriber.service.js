const Subscriber = require("../models/subscriber.model");

exports.getSummaryStats = async () => {
  const total = await Subscriber.countDocuments();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const newSubs = await Subscriber.countDocuments({
    STA_DATE: { $gte: startOfMonth, $lte: now },
  });

  const canceledSubs = await Subscriber.countDocuments({
    END_DATE: { $ne: null },
  });

  return { total, newSubs, canceledSubs };
};
