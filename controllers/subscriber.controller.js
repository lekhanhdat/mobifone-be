const Subscriber = require('../models/subscriber.model');
const subService = require('../services/subscriber.service');
const { filterSchema } = require('../utils/validation');
const { subscriberSchema } = require('../utils/validation');

exports.getSummary = async (req, res) => {
  try {
    const { error } = filterSchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const data = await subService.getSummaryStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const { error } = filterSchema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { page = 1, limit = 10, province, district, type, staType, subType, search } = req.query; // Add search
    const filter = {};
    if (province) filter.PROVINCE = province;
    if (district) filter.DISTRICT = district;
    if (type) filter.TYPE = type;
    if (staType) filter.STA_TYPE = staType;
    if (subType) filter.SUB_TYPE = subType;
    if (search) filter.SUB_ID = { $regex: search, $options: 'i' }; // Add regex search for SUB_ID

    const subscribers = await Subscriber.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const { districtMap, staMap, subMap, provinceMap } = await subService.getFullNamesCache();

    const enriched = subscribers.map(sub => ({
      ...sub.toObject(),
      fullDistrict: districtMap.get(`${sub.PROVINCE}-${sub.DISTRICT}`) || sub.DISTRICT || '',
      fullStaType: staMap.get(sub.STA_TYPE) || sub.STA_TYPE || '',
      fullSubType: subMap.get(sub.SUB_TYPE) || sub.SUB_TYPE || '', // Double fallback
      fullProvince: provinceMap.get(sub.PROVINCE) || sub.PROVINCE || ''
    }));

    const total = await Subscriber.countDocuments(filter);
    res.json({ subscribers: enriched, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSubscriber = async (req, res) => {
  try {
    const { error } = subscriberSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const subscriber = new Subscriber(req.body);
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (err) {
    res.status(500).json({ message: 'Internal error', details: err.message });
  }
};

exports.updateSubscriber = async (req, res) => {
  try {
    delete req.body._id; // Fix "_id" not allowed
    const { error } = subscriberSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (err) {
    res.status(500).json({ message: 'Internal error', details: err.message });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal error', details: err.message });
  }
};

exports.getSubscriberById = async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Not found' });
    const { districtMap, staMap, subMap, provinceMap } = await subService.getFullNamesCache();
    const enriched = {
      ...subscriber.toObject(),
      fullDistrict: districtMap.get(`${subscriber.PROVINCE}-${subscriber.DISTRICT}`) || subscriber.DISTRICT || '',
      fullStaType: staMap.get(subscriber.STA_TYPE) || subscriber.STA_TYPE || '',
      fullSubType: subMap.get(subscriber.SUB_TYPE) || subscriber.SUB_TYPE || '',
      fullProvince: provinceMap.get(subscriber.PROVINCE) || subscriber.PROVINCE || ''
    };
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Internal error', details: err.message });
  }
};

exports.getDistinct = async (req, res) => {
  try {
    const { field } = req.query;
    if (!field) return res.status(400).json({ error: 'Field required' });
    const values = await subService.getDistinctValues(field.toUpperCase());
    res.json(values);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistricts = async (req, res) => {
  try {
    const { province } = req.query;
    if (!province) return res.status(400).json({ error: 'Province required' });
    const districts = await subService.getDistrictsByProvince(province);
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPieAgg = async (req, res) => {
  try {
    const { groupBy, hasPackage } = req.query; // 'province' or 'district', hasPackage=true/false
    if (!['province', 'district'].includes(groupBy)) return res.status(400).json({ error: 'Invalid groupBy' });
    const data = await subService.getAggregationPie(groupBy, hasPackage === 'true'); // Parse string to bool
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBreakdown = async (req, res) => {
  try {
    const { groupBy } = req.query; // 'province-district', 'type', 'sta_type', 'sub_type'
    if (!['province-district', 'type', 'sta_type', 'sub_type'].includes(groupBy)) return res.status(400).json({ error: 'Invalid groupBy' });
    const data = await subService.getBreakdownAgg(groupBy);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOptions = async (req, res) => {
  try {
    const options = await subService.getOptions();
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};