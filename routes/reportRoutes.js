const express = require('express');
const { getWebUrlsController } = require('../controllers/reportController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');

router.get('/getUrls/:org_id', getWebUrlsController)

module.exports = router;