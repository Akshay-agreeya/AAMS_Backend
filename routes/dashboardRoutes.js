const express = require('express');
const { getCountController, getExpiringController, getRecentActivitiesController, getSummaryDetailReportController, getServiceTypeCountController, getOrgUserCountController, getProductComplianceController, getLatestNotificationController, updateNotificationStatusController } = require('../controllers/dashboardController');
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
 *         name: org_id
 *         schema:
 *           type: uuid
 *         description: org_id to fetch respective recent activities.
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to filter recent activities.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: page
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
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     size:
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
 * /api/dashboard/summary-report/{assessment_id}:
 *   get:
 *     tags:
 *       - Common API endpoints
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

/**
 * @swagger
 * /api/dashboard/service-type-count:
 *   get:
 *     summary: Get dashboard service-type-count
 *     description: Retrieves the total count of scanned products on the basis of service-type.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     responses:
 *       "200":
 *         description: Successfully retrieved dashboard service-type-count.
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
 *                       name:
 *                         type: string
 *                         example: "Website Accessibility"
 *                       service_count:
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
router.get('/service-type-count', verifyJwt, getServiceTypeCountController);

/**
 * @swagger
 * /api/dashboard/org-user-count/{org_id}:
 *   get:
 *     summary: Get dashboard statistics count
 *     description: Retrieves the total count of users, active_users, inactive_users, and reports for a particular org.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: ID of the organization to fetch
 *         schema:
 *           type: string
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
 *                       total_users:
 *                         type: integer
 *                         example: 3
 *                       active_users:
 *                         type: integer
 *                         example: 2
 *                       inactive_users:
 *                         type: integer
 *                         example: 1
 *                       total_reports:
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

 router.get('/org-user-count/:org_id',verifyJwt, getOrgUserCountController)

 /**
 * @swagger
 * /api/dashboard/total-products-compliance:
 *   get:
 *     summary: Get dashboard total products compliance
 *     description: Retrieves the product compliance data .
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     responses:
 *       "200":
 *         description: Retrieves the product compliance data.
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
 *                     type: object
 *                     properties:
 *                       total_products:
 *                         type: integer
 *                         example: 1
 *                       compliant_products:
 *                         type: integer
 *                         example: 0
 *                       non_compliant_products:
 *                         type: integer
 *                         example: 2
 *                       compliant_percentage:
 *                         type: integer
 *                         example: 0
 *                       non_compliant_percentage:
 *                         type: integer
 *                         example: 100
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
 router.get('/total-products-compliance', verifyJwt, getProductComplianceController);

 /**
 * @swagger
 * /api/dashboard/notifications/{user_id}:
 *   get: 
 *     tags:
 *       - Common API endpoints
 *     summary: Get user notifications
 *     description: >
 *       Retrieves the user's notifications. 
 *       If `latest_flag=1`, only the latest notifications will be returned. 
 *       If `latest_flag` is omitted or set to any other value, all notifications will be returned.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: ID of the user to fetch notifications for
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: latest_flag
 *         required: false
 *         description: >
 *           Set to 1 to retrieve only the latest notifications. 
 *           Leave empty or set to 0 to retrieve all notifications.
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           example: 1
 *     responses:
 *       "200":
 *         description: Details fetched successfully.
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
 *                       notification_id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: 0C99D86E-4B03-48F8-85FD-665D3541CE97
 *                       assessment_id:
 *                         type: integer
 *                         example: 1435263
 *                       status:
 *                         type: string
 *                         example: seen
 *                       created_at: 
 *                         type: string
 *                         format: date-time
 *                         example: 2025-04-07T11:35:33.797Z
 *                       summary_report_name: 
 *                         type: string
 *                         example: kiteflyers
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
 router.get('/notifications/:user_id', verifyJwt, getLatestNotificationController);

/**
 * @swagger
 * /api/dashboard/update-notification-status:
 *   patch:
 *     tags:
 *       - Common API endpoints
 *     summary: Update notification status
 *     description: Updates the status of a notification based on its ID.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notification_id
 *             properties:
 *               notification_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       "200":
 *         description: Notification status updated successfully.
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
 *                   example: "Notification status updated successfully!"
 *       "400":
 *         description: Bad Request - notification_id missing or invalid.
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
 *                   example: "Invalid notification_id provided."
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

 router.patch('/update-notification-status',verifyJwt, updateNotificationStatusController);

module.exports = router;