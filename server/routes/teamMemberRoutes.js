const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ============================================
// TEAM MEMBER MANAGEMENT (Seller Only)
// ============================================

// Add team member
router.post('/add', restrictTo('seller'), teamMemberController.addTeamMember);

// Remove team member
router.delete('/:teamMemberId', restrictTo('seller'), teamMemberController.removeTeamMember);

// Get seller's team members
router.get('/', restrictTo('seller'), teamMemberController.getTeamMembers);

// ============================================
// LEAD TRANSFER
// ============================================

// Transfer lead to team member
router.post('/transfer', restrictTo('seller'), teamMemberController.transferLead);

// ============================================
// TEAM MEMBER DASHBOARD
// ============================================

// Get leads assigned to team member (allow sellers and team members)
router.get('/leads/assigned', teamMemberController.getTeamMemberLeads);

module.exports = router;
