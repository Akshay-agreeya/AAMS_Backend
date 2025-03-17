const express = require('express');
const { getCountController, getExpiringController } = require('../controllers/dashboardController');
const {verifyJwt} = require('../middlewares/auth')

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/count:
 *   get:
 *     summary: Get dashboard statistics count
 *     description: Retrieves the total count of organizations, roles, users, and reports.
 *     security:
 *       - BearerAuth: []  # Requires JWT authentication
 *     responses:
 *       "200":
 *         description: Successfully retrieved dashboard statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Details fetched successfully."
 *                 contents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       OrgCount:
 *                         type: integer
 *                         example: 3
 *                       RoleCount:
 *                         type: integer
 *                         example: 4
 *                       UserCount:
 *                         type: integer
 *                         example: 5
 *                       ReportCount:
 *                         type: integer
 *                         example: 1
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
 *       "500":
 *         description: Internal Server Error - Unexpected error occurred.
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
 *                   example: "Internal server error."
 */

router.get('/count',verifyJwt, getCountController)

/**
 * @swagger
 * /api/dashboard/expiring_services:
 *   get:
 *     summary: Get expiring services
 *     description: Fetches services that are expiring within a user-specified number of days.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         required: true
 *         schema:
 *           type: integer
 *           example: 30
 *         description: The number of days to check for expiring services.
 *     responses:
 *       200:
 *         description: Successfully fetched expiring services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       organization_name:
 *                         type: string
 *                         example: "AgreeYa Solutions"
 *                       service_type:
 *                         type: string
 *                         example: "Website Accessibility"
 *                       expiry_date:
 *                         type: string
 *                         format: date
 *                         example: "04-10-2025"
 *       400:
 *         description: Invalid input (e.g., days <= 0)
 *       401:
 *         description: Unauthorized (JWT missing or invalid)
 *       404:
 *         description: No expiring services found
 *       500:
 *         description: Internal server error
 */
router.get('/expiring_services', verifyJwt, getExpiringController)

module.exports = router;