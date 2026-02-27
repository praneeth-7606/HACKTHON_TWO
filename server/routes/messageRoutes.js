const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All message routes are protected

router.post('/', messageController.sendMessage);
router.post('/automated-welcome', messageController.sendAutomatedWelcome);
router.get('/conversations', messageController.getConversations);
router.get('/history/:otherUserId', messageController.getChatHistory);
router.patch('/mark-read/:otherUserId', messageController.markAsRead);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/unread-messages', messageController.getUnreadMessages);

module.exports = router;
