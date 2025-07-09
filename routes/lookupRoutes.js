const express = require('express');
const { getOrgTypeController, getIndustryTypeController, getOperationTypeController, getPermissionsController, getGuidelineVersionController, getComplianceLevelController, getFrequencyController, getScanDaysController, getUserStatusController, getProdPermissionsController, getManualStatusController, getPlatformController, getAppTypeController, getLanguageController, getServiceTypeController } = require('../controllers/lookupController');

const router = express.Router();

/**
 * @swagger
 * /api/lookup/org-types:
 *   get:
 *     summary: Get all organization types
 *     description: Retrieves a list of all available organization types.
 *     responses:
 *       200:
 *         description: A list of organization types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/org-types', getOrgTypeController);

/**
 * @swagger
 * /api/lookup/industry-types:
 *   get:
 *     summary: Get all industry types
 *     description: Retrieves a list of all available industry types.
 *     responses:
 *       200:
 *         description: A list of industry types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/industry-types', getIndustryTypeController);

/**
 * @swagger
 * /api/lookup/operation-types:
 *   get:
 *     summary: Get all operation types
 *     description: Retrieves a list of all available operation types.
 *     responses:
 *       200:
 *         description: A list of operation types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/operation-types', getOperationTypeController);

/**
 * @swagger
 * /api/lookup/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieves a list of all available permissions.
 *     responses:
 *       200:
 *         description: A list of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/permissions', getPermissionsController);

/**
 * @swagger
 * /api/lookup/prod_permissions:
 *   get:
 *     summary: Get all prod_permissions
 *     description: Retrieves a list of all available prod_permissions.
 *     responses:
 *       200:
 *         description: A list of prod_permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/prod_permissions', getProdPermissionsController);

/**
 * @swagger
 * /api/lookup/user-status:
 *   get:
 *     summary: Get all user statuses
 *     description: Retrieves a list of all available user statuses.
 *     responses:
 *       200:
 *         description: A list of user statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/user-status', getUserStatusController);

/**
 * @swagger
 * /api/lookup/guideline-version:
 *   get:
 *     summary: Get the guideline version
 *     description: Retrieves the version of the current guideline.
 *     responses:
 *       200:
 *         description: The current guideline version
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/guideline-version', getGuidelineVersionController);

/**
 * @swagger
 * /api/lookup/compliance-level:
 *   get:
 *     summary: Get all compliance levels
 *     description: Retrieves a list of all available compliance levels.
 *     responses:
 *       200:
 *         description: A list of compliance levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/compliance-level', getComplianceLevelController);

/**
 * @swagger
 * /api/lookup/frequency:
 *   get:
 *     summary: Get all frequency options
 *     description: Retrieves a list of all available frequency options.
 *     responses:
 *       200:
 *         description: A list of frequency options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/frequency', getFrequencyController);

/**
 * @swagger
 * /api/lookup/scan-days:
 *   get:
 *     summary: Get all scan days
 *     description: Retrieves a list of all available scan days.
 *     responses:
 *       200:
 *         description: A list of scan days
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/scan-days', getScanDaysController);

router.get('/manual-status', getManualStatusController);
router.get('/platform', getPlatformController);
router.get('/app-type', getAppTypeController);
router.get('/languages', getLanguageController)
router.get('/service-types', getServiceTypeController)
module.exports = router;
