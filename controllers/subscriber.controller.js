const Subscriber = require('../models/subscriber.model');
const subService = require('../services/subscriber.service');

exports.getSummary = async (req, res) => {
  try {
    const data = await subService.getSummaryStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 10, province, district, type, staType, subType } = req.query;
    const filter = {};
    if (province) filter.PROVINCE = province;
    if (district) filter.DISTRICT = district;
    if (type) filter.TYPE = type;
    if (staType) filter.STA_TYPE = staType;
    if (subType) filter.SUB_TYPE = subType;

    const subscribers = await Subscriber.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const { districtMap, staMap, subMap } = await subService.getFullNamesCache();

    const enriched = subscribers.map(sub => ({
      ...sub.toObject(),
      fullDistrict: districtMap.get(`${sub.PROVINCE}-${sub.DISTRICT}`),
      fullStaType: staMap.get(sub.STA_TYPE),
      fullSubType: subMap.get(sub.SUB_TYPE)
    }));

    const total = await Subscriber.countDocuments(filter);
    res.json({ subscribers: enriched, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.filterSubscribers = async (req, res) => {
  // Keep if need, or merge with getSubscribers
  try {
    const filter = {};
    ['TYPE', 'PROVINCE', 'DISTRICT', 'STA_TYPE', 'SUB_TYPE'].forEach(field => {
      if (req.query[field]) filter[field] = req.query[field];
    });
    const subscribers = await Subscriber.find(filter).limit(100);
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};