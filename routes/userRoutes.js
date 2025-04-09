const express = require('express');
const { addUserToOrganizationController, editUserController, viewUserController, deleteUserController, getUsersController, updateUserStatusController, uploadImageController, getImageController } = require('../controllers/userController');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const { userSchema, editUserSchema } = require('../utils/validationSchema');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});


/**
 * @swagger
 * /api/user/add/{org_id}:
 *   post:
 *     summary: Add a user to an organization
 *     description: Adds a new user to the specified organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: ID of the organization to add the user to.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - role
 *               - first_name
 *               - last_name
 *     responses:
 *       201:
 *         description: User added to organization successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/add/:org_id', verifyJwt, validateInputs(userSchema), addUserToOrganizationController);

/**
 * @swagger
 * /api/user/edit/{user_id}:
 *   patch:
 *     summary: Edit a user's details
 *     description: Updates the details of an existing user by their user ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: ID of the user to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch('/edit/:user_id', verifyJwt, validateInputs(editUserSchema), editUserController);

/**
 * @swagger
 * /api/user/get/{user_id}:
 *   get:
 *     summary: Get a user's details
 *     description: Retrieves the details of a user by their user ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: ID of the user to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 role:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/get/:user_id', verifyJwt, viewUserController);

/**
 * @swagger
 * /api/user/delete/{user_id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by their user ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: ID of the user to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User successfully deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/delete/:user_id', verifyJwt, deleteUserController);

/**
 * @swagger
 * /api/user/list/{org_id}:
 *   get:
 *     summary: Get all users in an organization
 *     description: Retrieves a list of all users in the specified organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         description: ID of the organization to list users from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of users in the organization
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   role:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found or no users in organization
 */
router.get('/list/:org_id', verifyJwt, getUsersController);

/**
 * @swagger
 * /api/user/update/status:
 *   patch:
 *     summary: Update user status
 *     description: Updates the status of a user based on the provided user ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               status:
 *                 type: integer
 *                 example: 1
 *             required:
 *               - userId
 *               - status
 *     responses:
 *       200:
 *         description: User status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User status updated successfully."
 *       400:
 *         description: Invalid request or missing parameters.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
 router.patch('/update/status', verifyJwt, updateUserStatusController);

 router.post('/update/image', verifyJwt, upload.single('image'), uploadImageController);
 router.get('/display-image/:user_id', getImageController);


module.exports = router;
