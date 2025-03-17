const express = require('express');
const { getCountController } = require('../controllers/dashboardController');
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

module.exports = router;