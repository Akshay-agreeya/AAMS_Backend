const express = require('express');
const router = express.Router();
const { validateInputs } = require('../middlewares/validation');
const { userLoginAndFPSchema, changePasswordSchema } = require('../utils/validationSchema');
const { verifyJwt } = require('../middlewares/auth');
const { userLoginController, changePasswordController, forgotPasswordController, resetPasswordController, refreshAccessToken } = require('../controllers/loginController');

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Allows a user to log in to the system with their credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Successful login with JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid username or password
 *       401:
 *         description: Unauthorized
 */
router.post('/login', userLoginController);

  /**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: If email exists, reset link is sent.
 *       500:
 *         description: Server error while processing request.
 */
router.post('/user/forgot-password', forgotPasswordController);


/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Allows a user to reset their password using a valid reset token.
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *             required:
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
 router.post('/user/reset-password', resetPasswordController);


/**
 * @swagger
 * /api/user/change-password:
 *   patch:
 *     summary: Change user password
 *     description: Allows an authenticated user to change their password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             required:
 *               - oldPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or old password
 *       401:
 *         description: Unauthorized
 */
router.patch('/user/change-password', verifyJwt, validateInputs(changePasswordSchema), changePasswordController);

router.post('/refresh-token', refreshAccessToken);
module.exports = router;
