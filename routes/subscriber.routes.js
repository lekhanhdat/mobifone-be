const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

router.get('/summary', subscriberController.getSummary);
router.get('/', subscriberController.getSubscribers); // With pagination/filter
router.get('/filter', subscriberController.filterSubscribers); // Keep if need

module.exports = router;