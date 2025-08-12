const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

// Static routes first (no params)
router.get('/summary', subscriberController.getSummary);
router.get('/', subscriberController.getSubscribers);
router.post('/', subscriberController.createSubscriber); // POST 
router.get('/distinct', subscriberController.getDistinct);
router.get('/districts', subscriberController.getDistricts);
router.get('/pie', subscriberController.getPieAgg);
router.get('/breakdown', subscriberController.getBreakdown);
router.get('/options', subscriberController.getOptions);

// Dynamic routes last (with :id)
router.get('/:id', subscriberController.getSubscriberById);
router.put('/:id', subscriberController.updateSubscriber);
router.delete('/:id', subscriberController.deleteSubscriber);

module.exports = router;