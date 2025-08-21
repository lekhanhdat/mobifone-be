const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stat.controller');

router.get('/summary', statsController.getSummaryStats);
router.get('/packages', statsController.getPackageStats);
router.get('/trend', statsController.getGrowthTrend);
router.get('/package-trend', statsController.getPackageTrend); 
router.get('/distribution', statsController.getDistribution);
router.get('/options', statsController.getOptions);
router.post('/packages', statsController.addPackage);

module.exports = router;