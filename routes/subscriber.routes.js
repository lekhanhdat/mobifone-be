const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

router.get('/summary', subscriberController.getSummary);
router.get('/', subscriberController.getSubscribers);
router.get('/:id', subscriberController.getSubscriberById); // Nếu đã thêm CRUD
router.post('/', subscriberController.createSubscriber);
router.put('/:id', subscriberController.updateSubscriber);
router.delete('/:id', subscriberController.deleteSubscriber);

module.exports = router;