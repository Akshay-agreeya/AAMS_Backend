const express = require('express');
const { getCountController, getExpiringController, getRecentActivitiesController, getSummaryDetailReportController, getServiceTypeCountController } = require('../controllers/dashboardController');
const {verifyJwt} = require('../middlewares/auth')

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/count:
 *   get:
 *     summary: Get dashboard statistics count
 *     description: Retrieves the total count of organizations, roles, users, and reports.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
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
 * /api/dashboard/expiring-services:
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
router.get('/expiring-services', verifyJwt, getExpiringController)

/**
 * @swagger
 * /api/dashboard/recent-activities:
 *   get:
 *     summary: Get recent activities
 *     description: Fetches recent activities from the audit log with pagination and filtering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to filter recent activities.
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *     responses:
 *       200:
 *         description: Successfully fetched recent activities.
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
 *                       action_type:
 *                         type: string
 *                         example: "INSERT"
 *                       action_description:
 *                         type: string
 *                         example: "User added"
 *                       action_datetime:
 *                         type: string
 *                         example: "2025-03-14 10:45:32"
 *                       performed_by:
 *                         type: string
 *                         example: "John Doe (Admin - AgreeYa Solutions)"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                       example: 50
 *                     pageNumber:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Bad request (invalid input values).
 *       401:
 *         description: Unauthorized (missing or invalid JWT token).
 *       404:
 *         description: No recent activities found.
 *       500:
 *         description: Internal server error.
 */
router.get('/recent-activities', verifyJwt, getRecentActivitiesController)

/**
 * @swagger
 * /api/report/summary-report/{assessment_id}:
 *   get:
 *     summary: Get summary detail report for a specific assessment
 *     description: Retrieves summary detail report for a given assessment_id, including summary_detail_report_id, summary_report_id, issues, benchmark, guideline, and status
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: assessment_id
 *         required: true
 *         description: The unique identifier of the assessment.
 *         schema:
 *           type: integer
 *           example: 101
 *     responses:
 *       "200":
 *         description: Successfully retrieved summary detail report for the assessment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *                 message:
 *                   type: string
 *                   example: "Assessment ID cannot be null."
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
 *         description: Not Found - No summary detail report found for the given Assessment ID.
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
 *                   example: "No summary detail report found for the given Assessment ID."
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
router.get('/summary-report/:assessment_id', verifyJwt, getSummaryDetailReportController);

router.get('/service-type-count', verifyJwt, getServiceTypeCountController);

module.exports = router;