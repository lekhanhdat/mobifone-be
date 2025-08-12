// subscriber.service.js (full code, thay thế file cũ)
const Subscriber = require('../models/subscriber.model');
const District = require('../models/district.model');
const StaType = require('../models/sta_type.model');
const SubType = require('../models/sub_type.model');

let cache = null;
const getFullNamesCache = async () => {
  if (!cache) {
    const districts = await District.find({});
    const staTypes = await StaType.find({});
    const subTypes = await SubType.find({});
    cache = {
      districtMap: new Map(districts.map(d => [`${d.PROVINCE}-${d.DISTRICT}`, d.FULL_NAME || d.DISTRICT])),
      staMap: new Map(staTypes.map(s => [s.STA_TYPE, s.NAME || s.STA_TYPE])),
      subMap: new Map(subTypes.map(s => [s.SUB_TYPE, s.NAME || s.SUB_TYPE])),
      provinceMap: new Map([  // Hardcode 
        ['QNA', 'Quảng Nam'],
      ])
    };
  }
  return cache;
};

exports.getOptions = async () => {
  const { staMap, subMap, provinceMap, districtMap } = await getFullNamesCache();
  const provinces = await District.distinct('PROVINCE');
  const staTypes = Array.from(staMap.entries()).map(([value, label]) => ({ value, label }));
  const subTypes = Array.from(subMap.entries()).map(([value, label]) => ({ value, label }));
  const pckCodes = await Subscriber.distinct('PCK_CODE').then(codes => codes.filter(code => code)); // Filter null

  return {
    provinces: provinces.map(code => ({ value: code, label: provinceMap.get(code) || code })),
    staTypes,
    subTypes,
    types: [{ value: 'C', label: 'Trả trước' }, { value: 'F', label: 'Trả sau' }], // Hardcode TYPE
    pckCodes: pckCodes.map(code => ({ value: code, label: code })) // For dropdown optional
  };
};

exports.getDistinctValues = async (field) => {
  return await Subscriber.distinct(field);
};

exports.getDistrictsByProvince = async (province) => {
  const districts = await District.find({ PROVINCE: province });
  return districts.map(d => ({ value: d.DISTRICT, label: d.FULL_NAME || d.DISTRICT }));
};

exports.getAggregationPie = async (groupBy) => {
  let groupStage;
  if (groupBy === 'province') {
    groupStage = { _id: '$PROVINCE', count: { $sum: 1 } };
  } else if (groupBy === 'district') {
    groupStage = { _id: { province: '$PROVINCE', district: '$DISTRICT' }, count: { $sum: 1 } };
  } else {
    throw new Error('Invalid groupBy');
  }

  const agg = await Subscriber.aggregate([
    { $group: groupStage },
    { $project: { _id: 0, label: '$_id', value: '$count' } }
  ]);

  const { districtMap, provinceMap } = await getFullNamesCache();
  agg.forEach(item => {
    if (groupBy === 'province') {
      item.label = provinceMap.get(item.label) || item.label || 'Unknown'; // Giữ Quảng Nam
    } else if (groupBy === 'district') {
      const prov = item.label.province || 'Unknown';
      const dist = item.label.district || 'Unknown';
      item.label = districtMap.get(`${prov}-${dist}`) || `${dist} (${provinceMap.get(prov) || prov})`;
    }
  });

  return agg;
};

exports.getBreakdownAgg = async (groupBy) => {
  let groupStage;
  if (groupBy === 'province-district') {
    groupStage = { _id: { province: '$PROVINCE', district: '$DISTRICT' }, count: { $sum: 1 } };
  } else {
    groupStage = { _id: `$${groupBy.toUpperCase()}`, count: { $sum: 1 } };
  }

  const agg = await Subscriber.aggregate([
    { $group: groupStage },
    { $sort: { count: -1 } }
  ]);

  const { districtMap, staMap, subMap, provinceMap } = await getFullNamesCache();
  agg.forEach(item => {
    if (groupBy === 'province-district') {
      const prov = provinceMap.get(item._id.province) || item._id.province || 'Unknown';
      const dist = districtMap.get(`${item._id.province}-${item._id.district}`) || item._id.district || 'Unknown';
      item._id = `${dist} (${prov})`;
    } else if (groupBy === 'sta_type') {
      item._id = staMap.get(item._id) || item._id || '';
    } else if (groupBy === 'sub_type') {
      item._id = subMap.get(item._id) || item._id || '';
    } else if (groupBy === 'type') {
      const typeMap = { 'C': 'Trả trước', 'F': 'Trả sau' };
      item._id = typeMap[item._id] || item._id || 'Unknown';
    }
  });

  return agg;
};

exports.getFullNamesCache = getFullNamesCache;
exports.getSummaryStats = // ... (giữ nguyên);


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