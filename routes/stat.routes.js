const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stat.controller');

router.get('/summary', statsController.getSummaryStats);
router.get('/packages', statsController.getPackageStats);
router.get('/trend', statsController.getGrowthTrend);
router.get('/distribution', statsController.getDistribution);

module.exports = router;