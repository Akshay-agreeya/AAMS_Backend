const express = require('express');
const { getCountController } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/count',getCountController)

module.exports = router;