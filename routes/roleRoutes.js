const express = require('express');
const { getRolesController, addRoleAndDetailsController, updateRoleAndDetailsController, getRoleWithDetailsController, deleteRoleController } = require('../controllers/roleController');
const { verifyJwt } = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const { roleSchema } = require('../utils/validationSchema');
const router = express.Router();

/**
 * @swagger
 * /api/role/list:
 *   get:
 *     summary: Get all roles
 *     description: Fetches a list of all roles available in the system.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role_id:
 *                     type: string
 *                   role_name:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/list', verifyJwt, getRolesController);

/**
 * @swagger
 * /api/role/add:
 *   post:
 *     summary: Add a new role
 *     description: Allows an authenticated user to add a new role along with details.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - role_name
 *               - permissions
 *     responses:
 *       201:
 *         description: Role successfully added
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/add', verifyJwt, validateInputs(roleSchema), addRoleAndDetailsController);

/**
 * @swagger
 * /api/role/edit/{role_id}:
 *   patch:
 *     summary: Update a role by ID
 *     description: Allows an authenticated user to update an existing role and its details by role ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         description: ID of the role to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - role_name
 *               - permissions
 *     responses:
 *       200:
 *         description: Role successfully updated
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 */
router.patch('/edit/:role_id', verifyJwt, validateInputs(roleSchema), updateRoleAndDetailsController);

/**
 * @swagger
 * /api/role/get/{role_id}:
 *   get:
 *     summary: Get a role by ID
 *     description: Fetches details of a role by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         description: ID of the role to fetch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role_id:
 *                   type: string
 *                 role_name:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 */
router.get('/get/:role_id', verifyJwt, getRoleWithDetailsController);

/**
 * @swagger
 * /api/role/delete/{role_id}:
 *   delete:
 *     summary: Delete a role by ID
 *     description: Deletes a role by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         description: ID of the role to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role successfully deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 */
router.delete('/delete/:role_id', verifyJwt, deleteRoleController);

module.exports = router;
