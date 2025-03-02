const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const { addOrganizationController, getOrganizationByIdController, editOrganizationController, deleteOrgController, getOrganizationsController } = require('../controllers/organizationController');
const { orgSchema } = require('../utils/validationSchema');

/**
 * @swagger
 * /api/org/add:
 *   post:
 *     summary: Add a new organization
 *     description: Allows an authenticated user to add a new organization.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *             required:
 *               - name
 *               - address
 *     responses:
 *       201:
 *         description: Organization successfully added
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/add', verifyJwt, validateInputs(orgSchema), addOrganizationController);

/**
 * @swagger
 * /api/org/get/{org_id}:
 *   get:
 *     summary: Get an organization by ID
 *     description: Fetches details of an organization by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: ID of the organization to fetch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details retrieved successfully
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Unauthorized
 */
router.post('/get', verifyJwt, getOrganizationByIdController);

/**
 * @swagger
 * /api/org/edit/{org_id}:
 *   patch:
 *     summary: Edit an existing organization
 *     description: Allows an authenticated user to edit an organization's details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: ID of the organization to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *             required:
 *               - name
 *               - address
 *     responses:
 *       200:
 *         description: Organization successfully updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 */
router.patch('/edit/:org_id', verifyJwt, validateInputs(orgSchema), editOrganizationController);

/**
 * @swagger
 * /api/org/delete:
 *   delete:
 *     summary: Delete an organization
 *     description: Deletes an organization (requires organization ID in the request body).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               org_id:
 *                 type: string
 *             required:
 *               - org_id
 *     responses:
 *       200:
 *         description: Organization successfully deleted
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 */
router.delete('/delete', verifyJwt, deleteOrgController);

/**
 * @swagger
 * /api/org/list:
 *   get:
 *     summary: Get a list of all organizations
 *     description: Fetches a list of all organizations for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/list', verifyJwt, getOrganizationsController);

module.exports = router;
