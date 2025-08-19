const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller'); // New controller

router.post('/', packageController.addPackage); // POST /api/packages

module.exports = router;