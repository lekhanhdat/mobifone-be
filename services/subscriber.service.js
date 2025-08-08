const Subscriber = require('../models/subscriber.model');
const District = require('../models/district.model');
const StaType = require('../models/sta_type.model');
const SubType = require('../models/sub_type.model');

let cache = null; // Cache full names (load once, small data)
const getFullNamesCache = async () => {
  if (!cache) {
    const districts = await District.find({});
    const staTypes = await StaType.find({});
    const subTypes = await SubType.find({});
    cache = {
      districtMap: new Map(districts.map(d => [`${d.PROVINCE}-${d.DISTRICT}`, d.FULL_NAME || d.DISTRICT])),
      staMap: new Map(staTypes.map(s => [s.STA_TYPE, s.NAME || s.STA_TYPE])),
      subMap: new Map(subTypes.map(s => [s.SUB_TYPE, s.NAME || s.SUB_TYPE]))
    };
  }
  return cache;
};

exports.getSummaryStats = async (filter = {}) => {
  const total = await Subscriber.countDocuments(filter);
  const newSubs = await Subscriber.countDocuments({ ...filter, STA_DATE: { $exists: true } }); // Adjust for new in period
  const canceledSubs = await Subscriber.countDocuments({ ...filter, END_DATE: { $exists: true } });
  // % change: Compare with previous period (e.g., last month) - implement logic
  const prevFilter = { ...filter }; // TODO: Adjust for prev month (use date tools)
  const prevNew = await Subscriber.countDocuments(prevFilter); // Example, customize
  const percentChange = prevNew ? ((newSubs - prevNew) / prevNew * 100).toFixed(2) : 0;
  return { total, newSubs, canceledSubs, percentChange };
};

exports.getFullNamesCache = getFullNamesCache;