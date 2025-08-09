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
  // Tính total
  const total = await Subscriber.countDocuments(filter);

  // New subs: STA_DATE exists và trong period (nếu filter có STA_DATE range)
  const newSubsMatch = { ...filter, STA_DATE: { $exists: true } };
  const newSubs = await Subscriber.countDocuments(newSubsMatch);

  // Canceled: END_DATE exists
  const canceledMatch = { ...filter, END_DATE: { $exists: true } };
  const canceledSubs = await Subscriber.countDocuments(canceledMatch);

  // Percent change: So với tháng trước (dùng aggregation để lấy count prev)
  let prevNew = 0;
  if (filter.STA_DATE) { // Nếu có range, tính prev range tương đương
    const { $gte: start, $lte: end } = filter.STA_DATE;
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);
    prevNew = await Subscriber.countDocuments({ ...filter, STA_DATE: { $gte: prevStart, $lte: prevEnd } });
  }
  const percentChange = prevNew ? ((newSubs - prevNew) / prevNew * 100).toFixed(2) : 'N/A';

  return { total, newSubs, canceledSubs, percentChange };
};

exports.getFullNamesCache = getFullNamesCache;