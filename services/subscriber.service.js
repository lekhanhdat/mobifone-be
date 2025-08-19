// subscriber.service.js (full code, thay thế file cũ)
const Subscriber = require('../models/subscriber.model');
const District = require('../models/district.model');
const StaType = require('../models/sta_type.model');
const SubType = require('../models/sub_type.model');
const Package = require('../models/package.model'); 

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
      provinceMap: new Map([  // Hardcode hoặc fetch từ model nếu có
        ['QNA', 'Quảng Nam'],
        // Thêm tỉnh khác nếu cần, hoặc tạo model Province riêng
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
  const pckCodes = await Package.find({}).select('code charge');

  return {
    provinces: provinces.map(code => ({ value: code, label: provinceMap.get(code) || code })),
    staTypes,
    subTypes,
    types: [{ value: 'C', label: 'Trả trước' }, { value: 'F', label: 'Trả sau' }], // Hardcode TYPE
    pckCodes: pckCodes.map(p => ({ value: p.code, label: p.code, charge: p.charge }))
  };
};

exports.getDistinctValues = async (field) => {
  return await Subscriber.distinct(field);
};

exports.getDistrictsByProvince = async (province) => {
  const districts = await District.find({ PROVINCE: province });
  return districts.map(d => ({ value: d.DISTRICT, label: d.FULL_NAME || d.DISTRICT }));
};

exports.getAggregationPie = async (groupBy, hasPackage = false) => { // Thêm param hasPackage
  let groupStage;
  if (groupBy === 'province') {
    groupStage = { _id: '$PROVINCE', count: { $sum: 1 } };
  } else if (groupBy === 'district') {
    groupStage = { _id: { province: '$PROVINCE', district: '$DISTRICT' }, count: { $sum: 1 } };
  } else {
    throw new Error('Invalid groupBy');
  }

  const match = { DISTRICT: { $ne: null, $ne: '' } }; // Filter null/empty DISTRICT
  if (hasPackage) {
    match.PCK_CODE = { $exists: true, $ne: '' }; // Lọc chỉ có gói cước (tối ưu với index)
  }

  const agg = await Subscriber.aggregate([
    { $match: match },
    { $group: groupStage },
    { $match: { count: { $gt: 0 } } },
    { $project: { _id: 0, label: '$_id', value: '$count' } }
  ]);

  const { districtMap, provinceMap } = await getFullNamesCache();
  const seenLabels = new Set();
  const uniqueAgg = [];

  agg.forEach(item => {
    let label;
    if (groupBy === 'province') {
      label = provinceMap.get(item.label) || item.label || 'Unknown';
    } else if (groupBy === 'district') {
      const prov = provinceMap.get(item.label.province) || item.label.province || 'Unknown';
      const dist = districtMap.get(`${item.label.province}-${item.label.district}`) || item.label.district || 'Unknown';
      label = dist; // Chỉ district full name
    }
    if (!seenLabels.has(label)) {
      item.label = label;
      uniqueAgg.push(item);
      seenLabels.add(label);
    }
  });

  return uniqueAgg;
};

exports.getBreakdownAgg = async (groupBy, hasPackage = false) => { // Thêm hasPackage nếu cần, nhưng breakdown chưa dùng ở Package
  let groupStage;
  if (groupBy === 'province-district') {
    groupStage = { _id: { province: '$PROVINCE', district: '$DISTRICT' }, count: { $sum: 1 } };
  } else {
    groupStage = { _id: `$${groupBy.toUpperCase()}`, count: { $sum: 1 } };
  }

  const match = { DISTRICT: { $ne: null, $ne: '' } };
  if (hasPackage) {
    match.PCK_CODE = { $exists: true, $ne: '' };
  }

  const agg = await Subscriber.aggregate([
    { $match: match },
    { $group: groupStage },
    { $match: { count: { $gt: 0 } } },
    { $sort: { count: -1 } }
  ]);

  const { districtMap, staMap, subMap, provinceMap } = await getFullNamesCache();
  const seenIds = new Set();
  const uniqueAgg = [];

  agg.forEach(item => {
    let id;
    if (groupBy === 'province-district') {
      const prov = provinceMap.get(item._id.province) || item._id.province || 'Unknown';
      const dist = districtMap.get(`${item._id.province}-${item._id.district}`) || item._id.district || 'Unknown';
      id = dist;
    } else if (groupBy === 'sta_type') {
      id = staMap.get(item._id) || item._id || '';
    } else if (groupBy === 'sub_type') {
      id = subMap.get(item._id) || item._id || '';
    } else if (groupBy === 'type') {
      id = (item._id === 'C' ? 'Trả trước' : item._id === 'F' ? 'Trả sau' : item._id) || 'Unknown';
    }
    if (!seenIds.has(id)) {
      item._id = id;
      uniqueAgg.push(item);
      seenIds.add(id);
    }
  });

  return uniqueAgg;
};

exports.getFullNamesCache = getFullNamesCache;

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

  const baseMatch = {}; // For no time
  if (filter.province) baseMatch.PROVINCE = { $regex: filter.province, $options: 'i' };
  if (filter.district) baseMatch.DISTRICT = { $regex: filter.district, $options: 'i' };

  // Total: All time, province/district if filter
  const total = await Subscriber.countDocuments(baseMatch);

  // Total packages: All time, chỉ có PCK_CODE (tối ưu cho summary nếu cần hasPackage)
  const totalPackages = await Subscriber.countDocuments({ ...baseMatch, PCK_CODE: { $exists: true, $ne: '' } });

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