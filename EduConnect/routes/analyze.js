const express = require('express');
const router = express.Router();
const { analyzeProfile } = require('../controllers/analyzeController');

// POST /api/analyze
router.post('/', analyzeProfile);

module.exports = router; 