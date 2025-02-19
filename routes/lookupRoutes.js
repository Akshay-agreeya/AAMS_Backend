const express = require('express');
const { getOrgTypeController, getIndustryTypeController } = require('../controllers/lookupController');
const router = express.Router();

router.get('/org-types', getOrgTypeController);
router.get('/industry-types', getIndustryTypeController);

module.exports = router;