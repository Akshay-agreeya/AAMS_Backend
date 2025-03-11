const express = require('express');
const {
  addProductController,
  updateProductController,
  viewProductController,
  getProductsController,
  deleteProductController,
  myProductsController
} = require('../controllers/productController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const { productSchema } = require('../utils/validationSchema');

/**
 * @swagger
 * /api/product/add/{org_id}:
 *   post:
 *     summary: Add a new product
 *     description: Adds a new product to the organization by providing product details.
 *     parameters:
 *       - name: org_id
 *         in: path
 *         description: ID of the organization
 *         required: true
 *         schema:
 *           type: string
 *       - name: product
 *         in: body
 *         description: Product object to be added
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Product'
 *     responses:
 *       200:
 *         description: Product added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/add/:org_id', verifyJwt, validateInputs(productSchema), addProductController);

/**
 * @swagger
 * /api/product/edit/{service_id}:
 *   patch:
 *     summary: Update an existing product
 *     description: Updates an existing product by providing the product ID and new details.
 *     parameters:
 *       - name: service_id
 *         in: path
 *         description: ID of the product to be updated
 *         required: true
 *         schema:
 *           type: string
 *       - name: product
 *         in: body
 *         description: Updated product object
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
router.patch('/edit/:service_id', verifyJwt, validateInputs(productSchema), updateProductController);

/**
 * @swagger

 * /api/product/view/{service_id}:

 *   get:
 *     summary: View product details
 *     description: Get details of a specific product by product ID.
 *     parameters:
 *       - name: service_id
 *         in: path
 *         description: ID of the product to view
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/view/:service_id', verifyJwt, viewProductController);

/**
 * @swagger

 * /api/product/get/{org_id}:

 *   get:
 *     summary: Get all products in an organization
 *     description: Retrieves all products in an organization by its ID.
 *     parameters:
 *       - name: org_id
 *         in: path
 *         description: ID of the organization
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/get/:org_id', verifyJwt, getProductsController);

/**
 * @swagger
 * /api/product/my/{user_id}:
 *   get:
 *     summary: Get a user's products with assessment details
 *     description: Retrieves distinct web URLs assigned to a user, along with the count of assessments and the latest assessment date.
 *     security:
 *       - BearerAuth: []  # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: The unique identifier of the user.
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "CF397886-0270-4FAD-A1F8-CA422453B764"
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
 *         description: Successfully retrieved the user's products.
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
 *                       total_assessments:
 *                         type: integer
 *                         example: 5
 *                       latest_assessment_date:
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
 *                   example: "User ID cannot be null."
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
 *         description: Not Found - User does not exist.
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
 *                   example: "User ID not found."
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
router.get('/my/:user_id',verifyJwt, myProductsController);

/**
 * @swagger

 * /api/product/delete/{service_id}:

 *   delete:
 *     summary: Delete a product
 *     description: Delete a specific product by providing its ID.
 *     parameters:
 *       - name: service_id
 *         in: path
 *         description: ID of the product to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/delete/:service_id', verifyJwt, deleteProductController);

module.exports = router;
