const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const {validateInputs} = require('../middlewares/validation');
const {productPermissionSchema} = require('../utils/validationSchema')
const {getPermissionController, updateUserPermissionController} = require('../controllers/permissionController')

/**
 * @swagger
 * /api/permission/get/{org_id}:
 *   get:
 *     summary: Get product permissions by organization ID
 *     description: Retrieve all users, services, and product permissions associated with a specific organization.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the organization
 *     responses:
 *       200:
 *         description: Successfully retrieved permissions data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         description: Unique identifier of the user
 *                       username:
 *                         type: string
 *                         description: Username of the user
 *                       role_id:
 *                         type: integer
 *                         description: Role ID assigned to the user
 *                       role_name:
 *                         type: string
 *                         description: Name of the role
 *                 Service:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       service_id:
 *                         type: integer
 *                         description: Unique identifier of the service
 *                       webUrl:
 *                         type: string
 *                         description: URL of the service
 *                 prod_permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         description: User ID associated with the permission
 *                       service_id:
 *                         type: integer
 *                         description: Service ID linked to the permission
 *                       product_permission_opr_id:
 *                         type: integer
 *                         description: Product permission operation ID
 *                 allPermissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_permission_opr_id:
 *                         type: integer
 *                         description: Unique ID for product permission operation
 *                       product_permission_opr_name:
 *                         type: string
 *                         description: Name of the product permission operation
 *                       operation_type:
 *                         type: string
 *                         description: Type of operation
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Data not found for the provided organization ID
 *       500:
 *         description: Internal server error
 */

router.get('/get/:org_id', verifyJwt,getPermissionController );

/**
 * @swagger
 * /api/permission/update:
 *   post:
 *     summary: Update User Permissions
 *     description: Updates the permissions for users on a specific service. If `product_permission_opr_ids` is an empty array, all permissions for that user will be removed.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usersWithServices
 *             properties:
 *               usersWithServices:
 *                 type: array
 *                 description: List of users and their service permissions.
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_id
 *                     - service_id
 *                     - product_permission_opr_ids
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "CF397886-0270-4FAD-A1F8-CA422453B764"
 *                     service_id:
 *                       type: integer
 *                       example: 7
 *                     product_permission_opr_ids:
 *                       type: array
 *                       description: List of permission operation IDs for the user. If empty, all permissions will be removed.
 *                       items:
 *                         type: integer
 *                       example: [1, 2, 3]
 *     responses:
 *       "200":
 *         description: User permissions updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User permissions updated successfully."
 *                 resp:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: "CF397886-0270-4FAD-A1F8-CA422453B764"
 *                       service_id:
 *                         type: integer
 *                         example: 7
 *                       updated_permissions:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         example: [1, 2, 3]
 *       "400":
 *         description: Bad Request - Invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["usersWithServices is required."]
 *       "401":
 *         description: Unauthorized - JWT token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Invalid token."
 *       "404":
 *         description: Not Found - User or service not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User or service not found."
 *       "500":
 *         description: Internal Server Error - Unexpected error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 */

router.post('/update', verifyJwt, validateInputs(productPermissionSchema), updateUserPermissionController);

module.exports = router;