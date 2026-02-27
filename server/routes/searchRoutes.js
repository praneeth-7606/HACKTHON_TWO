const express = require('express');
const router = express.Router();
const { searchProperties } = require('../controllers/searchController');

// POST /api/v1/search/properties - Smart property search
router.post('/properties', searchProperties);

module.exports = router;
