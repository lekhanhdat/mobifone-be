const subService = require("../services/subscriber.service");

exports.getSummary = async (req, res) => {
  try {
    const data = await subService.getSummaryStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.filterSubscribers = async (req, res) => {
  try {
    const filter = {};

    const fields = ["TYPE", "PROVINCE", "DISTRICT", "STA_TYPE", "SUB_TYPE"];
    fields.forEach((field) => {
      if (req.query[field]) {
        filter[field] = req.query[field];
      }
    });

    const subscribers = await Subscriber.find(filter).limit(100);
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

