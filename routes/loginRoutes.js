const express = require('express');
const router = express.Router();
const { validateInputs } = require('../middlewares/validation');
const { userLoginAndFPSchema, changePasswordSchema } = require('../utils/validationSchema');
const { verifyJwt } = require('../middlewares/auth');
const { userLoginController, forgotAndResetPasswordController, changePasswordController } = require('../controllers/loginController');

/**
 * @swagger
 * /api/login/login:
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
 * /api/user/reset-password:
 *   patch:
 *     summary: Reset user password
 *     description: Allows a user to reset their password using the provided login and recovery info.
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
 *         description: Password reset successful
 *       400:
 *         description: Invalid input or recovery details
 */
router.patch('/user/reset-password', validateInputs(userLoginAndFPSchema), forgotAndResetPasswordController);

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

module.exports = router;
