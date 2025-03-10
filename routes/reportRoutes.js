const express = require('express');
const { getWebUrlsController } = require('../controllers/reportController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');

/**
 * @swagger
 * /api/report/getUrls/{org_id}:
 *   get:
 *     summary: Get web URLs for an organization with assessment details
 *     description: Retrieves distinct web URLs associated with a given organization, including accessibility issue details and the latest assessment date.
 *     security:
 *       - BearerAuth: []  # Requires JWT authentication
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

router.get('/getUrls/:org_id', verifyJwt, getWebUrlsController)

module.exports = router;