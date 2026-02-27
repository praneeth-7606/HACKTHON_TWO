const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Example of protected route
router.get('/me', protect, authController.getMe);
router.get('/:id', protect, authController.getUser);
router.patch('/updateMe', protect, authController.updateMe);

module.exports = router;
