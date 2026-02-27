const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    generateQuestions,
    submitAnswer,
    completeQA,
    getQA
} = require('../controllers/qaController');

// POST /api/v1/qa/generate/:propertyId - Generate questions (protected)
router.post('/generate/:propertyId', protect, generateQuestions);

// POST /api/v1/qa/answer/:propertyId - Submit answer (protected)
router.post('/answer/:propertyId', protect, submitAnswer);

// POST /api/v1/qa/complete/:propertyId - Mark as completed (protected)
router.post('/complete/:propertyId', protect, completeQA);

// GET /api/v1/qa/:propertyId - Get Q&A (public - for buyers)
router.get('/:propertyId', getQA);

module.exports = router;
