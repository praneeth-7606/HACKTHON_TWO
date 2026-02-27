const express = require('express');
const propertyController = require('../controllers/propertyController');
const { parsePDF, parseText } = require('../controllers/parseController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ─── AI PARSE ROUTES (protected — any logged in user) ─────────────────────────
// POST /api/v1/properties/parse-pdf   — accepts multipart/form-data with field "document"
// POST /api/v1/properties/parse-text  — accepts JSON body { "text": "..." }
router.post('/parse-pdf', protect, parsePDF);
router.post('/parse-text', protect, parseText);

// ─── PROPERTY CRUD ───────────────────────────────────────────────────────────
router.route('/')
    .get(propertyController.getAllProperties)
    .post(protect, restrictTo('seller', 'admin'), propertyController.createProperty);

// Get seller's own properties
router.get('/seller/my-properties', protect, restrictTo('seller'), propertyController.getSellerProperties);

router.get('/:id', propertyController.getProperty);
router.patch('/:id', protect, propertyController.updateProperty);

// ─── SAVE/UNSAVE PROPERTY (protected) ────────────────────────────────────────
router.post('/:id/save', protect, propertyController.saveProperty);
router.get('/saved/me', protect, propertyController.getSavedProperties);

// ─── SOCIAL INTERACTIONS (protected) ─────────────────────────────────────────
router.post('/:id/like', protect, propertyController.likeProperty);
router.post('/:id/comment', protect, propertyController.addComment);
router.post('/:id/opinion', protect, propertyController.submitOpinion);
router.post('/:id/summarize', protect, propertyController.summarizeProperty);
router.post('/:id/track-interest', protect, propertyController.trackInterest);
router.get('/notifications/me', protect, propertyController.getNotifications);

module.exports = router;
