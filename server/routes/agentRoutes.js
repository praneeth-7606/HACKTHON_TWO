const express = require('express');
const agentController = require('../controllers/agentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All agent routes are protected

router.post('/chat', agentController.chatWithAgent);
router.get('/history/:sessionId', agentController.getConversationHistory);
router.delete('/clear/:sessionId', agentController.clearConversation);

module.exports = router;
