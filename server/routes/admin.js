const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all routes - only admins can access
router.use(protect);
router.use(restrictTo('admin'));

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/logs', adminController.getAdminLogs);

// ============================================
// USER MANAGEMENT
// ============================================
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/bulk-update', adminController.bulkUpdateUsers);

// ============================================
// PROPERTY APPROVAL
// ============================================
router.get('/properties', adminController.getAllPropertiesForAdmin);
router.get('/properties/pending', adminController.getPendingProperties);
router.patch('/properties/:propertyId/approve', adminController.approveProperty);
router.patch('/properties/:propertyId/reject', adminController.rejectProperty);
router.post('/properties/approve-existing', adminController.approveAllExistingProperties);

module.exports = router;
