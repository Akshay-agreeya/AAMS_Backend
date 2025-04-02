const express = require('express');
const { getWebUrlsController, getAssessmentsController, getCategoryDataController, getUserWebUrlsController } = require('../controllers/reportController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');

/**
 * @swagger
 * /api/report/get/urls/{org_id}:
 *   get:
 *     summary: Get web URLs for an organization with assessment details
 *     description: Retrieves distinct web URLs associated with a given organization, including accessibility issue details and the latest assessment date.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: The unique identifier of the organization.
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "450253B3-9617-4C32-B53D-C222E19AF8B8"
 *       - in: query
 *         name: PageNumber
 *         required: false
 *         description: The page number for pagination (default is 1).
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: PageSize
 *         required: false
 *         description: The number of records per page (default is 10).
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       "200":
 *         description: Successfully retrieved web URLs for the organization.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalCount:
 *                   type: integer
 *                   example: 30
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       service_id:
 *                         type: integer
 *                         example: 101
 *                       web_url:
 *                         type: string
 *                         example: "https://example.com/accessibility"
 *                       category:
 *                         type: string
 *                         example: "Accessibility"
 *                       issues:
 *                         type: integer
 *                         example: 5
 *                       assessment_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-07T10:00:00Z"
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
 *                   example: "Org ID cannot be null."
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
 *         description: Not Found - Organization does not exist.
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
 *                   example: "Organization ID not found."
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

router.get('/get/urls/:org_id', verifyJwt, getWebUrlsController);

/**
 * @swagger
 * /api/report/get/user-urls:
 *   get:
 *     summary: Get web URLs for a user with assessment details
 *     description: Retrieves distinct web URLs associated with a logged in user, including accessibility issue details and the latest assessment date.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: query
 *         name: permission_name
 *         required: true
 *         description: the required permission_name
 *         schema:
 *           type: string
 *           example: Product_View
 *       - in: query
 *         name: PageNumber
 *         required: false
 *         description: The page number for pagination (default is 1).
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: PageSize
 *         required: false
 *         description: The number of records per page (default is 10).
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       "200":
 *         description: Successfully retrieved web URLs for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalCount:
 *                   type: integer
 *                   example: 30
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       service_id:
 *                         type: integer
 *                         example: 101
 *                       web_url:
 *                         type: string
 *                         example: "https://example.com/accessibility"
 *                       category:
 *                         type: string
 *                         example: "Accessibility"
 *                       issues:
 *                         type: integer
 *                         example: 5
 *                       assessment_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-07T10:00:00Z"
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
 *                   example: "Org ID cannot be null."
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
 *         description: Not Found - user does not exist.
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
 *                   example: "UserID not found."
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
router.get('/get/user-urls', verifyJwt, getUserWebUrlsController);

/**
 * @swagger
 * /api/report/get/assessments/{service_id}:
 *   get:
 *     summary: Get assessment details for a specific service
 *     description: Retrieves all assessments for a given service_id, including scan date, report name, issues, benchmark, guideline, and web URL. Supports pagination.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: service_id
 *         required: true
 *         description: The unique identifier of the service.
 *         schema:
 *           type: integer
 *           example: 101
 *       - in: query
 *         name: PageNumber
 *         required: false
 *         description: The page number for pagination (default is 1).
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: PageSize
 *         required: false
 *         description: The number of records per page (default is 10).
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       "200":
 *         description: Successfully retrieved assessment details for the service.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalCount:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       web_url:
 *                         type: string
 *                         example: "https://example.com/a11y"
 *                       scan_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-07T10:00:00Z"
 *                       report_name:
 *                         type: string
 *                         example: "WCAG Compliance Report"
 *                       issues:
 *                         type: integer
 *                         example: 5
 *                       benchmark:
 *                         type: string
 *                         example: "AA"
 *                       guideline:
 *                         type: string
 *                         example: "Color Contrast"
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
 *                   example: "Service ID cannot be null."
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
 *         description: Not Found - No assessments found for the given service ID.
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
 *                   example: "No assessments found for the given service ID."
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
router.get('/get/assessments/:service_id', verifyJwt, getAssessmentsController)

/**
 * @swagger
 * /api/report/get/category-data/{assessment_id}:
 *   get:
 *     summary: Get category-related data for a specific assessment
 *     description: Retrieves category data including issue details, guidelines, and remediation steps for a given assessment_id.
 *     security:
 *       - bearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: assessment_id
 *         required: true
 *         description: The unique identifier of the assessment.
 *         schema:
 *           type: integer
 *           example: 695751856
 *     responses:
 *       "200":
 *         description: Successfully retrieved category data for the assessment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   category_id:
 *                     type: integer
 *                     example: 442910938
 *                   level:
 *                     type: string
 *                     example: "Important"
 *                   issue_description:
 *                     type: string
 *                     example: "Don't use CSS animations or transitions in interactions without giving the user a way to turn them off."
 *                   guideline:
 *                     type: string
 *                     example: "WCAG 2.1 2.3.3"
 *                   failing_page:
 *                     type: integer
 *                     example: 1
 *                   status:
 *                     type: string
 *                     example: "open"
 *                   guideline_url:
 *                     type: string
 *                     format: uri
 *                     example: "https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html"
 *                   category_report_type:
 *                     type: string
 *                     example: "Accessibility"
 *                   category_report_name:
 *                     type: string
 *                     example: "thekiteflyers"
 *                   assessment_id:
 *                     type: integer
 *                     example: 695751856
 *                   category_details:
 *                     type: array
 *                     description: List of category details related to the issue.
 *                     items:
 *                       type: object
 *                       properties:
 *                         category_detail_id:
 *                           type: integer
 *                           example: 799385998
 *                         criteria:
 *                           type: string
 *                           example: ""
 *                         remediation:
 *                           type: string
 *                           example: "Use the @media (prefers-reduced-motion) media query to respect user preferences."
 *                         page_url:
 *                           type: string
 *                           format: uri
 *                           example: "https://agreeya.com/about-agreeya/"
 *                         line_numbers:
 *                           type: string
 *                           example: "2913, 2913, 2913, 2917"
 *                         status:
 *                           type: string
 *                           example: "Open"
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
 *         description: Not Found - No category data found for the given assessment ID.
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
 *                   example: "No category data found for the given assessment ID."
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

router.get('/get/category-data/:assessment_id', verifyJwt, getCategoryDataController);

module.exports = router;