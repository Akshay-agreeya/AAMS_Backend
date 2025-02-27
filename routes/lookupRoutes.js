const express = require('express');
const { getOrgTypeController, getIndustryTypeController, getOperationTypeController, getPermissionsController, getGuidelineVersionController, getComplianceLevelController, getFrequencyController, getScanDaysController, getUserStatusController } = require('../controllers/lookupController');
const router = express.Router();

router.get('/org-types', getOrgTypeController);
router.get('/industry-types', getIndustryTypeController);
router.get('/operation-types', getOperationTypeController);
router.get('/permissions', getPermissionsController);
router.get('/user-status', getUserStatusController);
router.get('/guideline-version', getGuidelineVersionController);
router.get('/compliance-level', getComplianceLevelController);
router.get('/frequency', getFrequencyController);
router.get('/scan-days', getScanDaysController);

module.exports = router;