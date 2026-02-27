const express = require('express');
const leadController = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

// Tracking endpoints (called by frontend)
router.post('/track/view/:propertyId', leadController.trackPropertyView);
router.post('/track/time', leadController.trackTimeSpent);
router.post('/track/qa', leadController.trackQAInteraction);
router.post('/track/engagement', leadController.trackEngagement);
router.post('/track/ai', leadController.trackAIInteraction);
router.post('/track/contact', leadController.trackOwnerContact);

// Seller dashboard endpoints
router.get('/seller/leads', leadController.getSellerLeads);
router.get('/lead/:leadId', leadController.getLeadDetails);
router.patch('/lead/:leadId/respond', leadController.markLeadResponded);

module.exports = router;
