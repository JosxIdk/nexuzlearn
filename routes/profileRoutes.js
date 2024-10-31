// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/profile/:uniqueId', profileController.viewProfile);

module.exports = router;