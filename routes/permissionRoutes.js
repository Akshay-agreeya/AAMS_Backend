const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const {getPermissionController} = require('../controllers/permissionController')

/**
 * @swagger
 * /get/{org_id}:
 *   get:
 *     summary: Get product permissions by organization ID
 *     description: Retrieve all users, services, and product permissions associated with a specific organization.
 *     tags:
 *       - Permissions
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

module.exports = router;