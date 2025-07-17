const express = require("express");
const router = express.Router();

const subController = require("../controllers/subscriber.controller");
router.get("/summary", subController.getSummary);

const subscriberController = require("../controllers/subscriber.controller");
// Lọc nhiều trường
router.get("/filter", subscriberController.filterSubscribers);

module.exports = router;
