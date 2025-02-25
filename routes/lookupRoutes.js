const express = require('express');
const { getOrgTypeController, getIndustryTypeController, getOperationTypeController, getPermissionsController } = require('../controllers/lookupController');
const router = express.Router();

router.get('/org-types', getOrgTypeController);
router.get('/industry-types', getIndustryTypeController);
router.get('/operation-types', getOperationTypeController);
router.get('/permissions', getPermissionsController)

module.exports = router;