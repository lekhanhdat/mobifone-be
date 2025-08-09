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
  const now = new Date();
  let timeMatch = {}; // For time-dependent
  if (filter.fromMonth && filter.fromYear && filter.toMonth && filter.toYear) {
    timeMatch = {
      $gte: new Date(filter.fromYear, filter.fromMonth - 1, 1, 0, 0, 0),
      $lte: new Date(filter.toYear, filter.toMonth, 0, 23, 59, 59),
    };
  } else {
    // Default current month for new/hủy
    timeMatch = {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }

  const baseMatch = { }; // For no time
  if (filter.province) baseMatch.PROVINCE = { $regex: filter.province, $options: 'i' }; // Case insensitive
  if (filter.district) baseMatch.DISTRICT = { $regex: filter.district, $options: 'i' };

  // Total: All time, province/district if filter
  const total = await Subscriber.countDocuments(baseMatch);

  // Total packages: All time
  const totalPackages = await Subscriber.countDocuments({ ...baseMatch, PCK_CODE: { $exists: true, $ne: null } });

  // New/hủy in time range
  const newSubs = await Subscriber.countDocuments({ ...baseMatch, STA_DATE: timeMatch });
  const canceledSubs = await Subscriber.countDocuments({ ...baseMatch, END_DATE: timeMatch });

  // Separate % vs prev same length
  const periodMonths = ((filter.toYear || now.getFullYear()) - (filter.fromYear || now.getFullYear())) * 12 + ((filter.toMonth || now.getMonth() + 1) - (filter.fromMonth || now.getMonth() + 1)) + 1;
  const prevStart = new Date(timeMatch.$gte);
  prevStart.setMonth(prevStart.getMonth() - periodMonths);
  const prevEnd = new Date(timeMatch.$lte);
  prevEnd.setMonth(prevEnd.getMonth() - periodMonths);
  const prevNew = await Subscriber.countDocuments({ ...baseMatch, STA_DATE: { $gte: prevStart, $lte: prevEnd } });
  const percentNew = prevNew === 0 ? (newSubs > 0 ? 100 : 0) : ((newSubs - prevNew) / prevNew * 100).toFixed(1);

  const prevCanceled = await Subscriber.countDocuments({ ...baseMatch, END_DATE: { $gte: prevStart, $lte: prevEnd } });
  const percentCanceled = prevCanceled === 0 ? (canceledSubs > 0 ? 100 : 0) : ((canceledSubs - prevCanceled) / prevCanceled * 100).toFixed(1);

  return { total, newSubs, canceledSubs, totalPackages, percentNew, percentCanceled };
};

exports.getFullNamesCache = getFullNamesCache;