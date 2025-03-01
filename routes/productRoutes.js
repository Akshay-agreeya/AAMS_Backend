const express = require('express');
const { 
  addProductController, 
  updateProductController, 
  viewProductController, 
  getProductsController, 
  deleteProductController 
} = require('../controllers/productController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const { productSchema } = require('../utils/validationSchema');

/**
 * @swagger
 * /products/add/{org_id}:
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
 * /products/edit/{service_id}:
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
 * /products/view/{service_id}:
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
 * /products/get/{org_id}:
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
 * /products/delete/{service_id}:
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
