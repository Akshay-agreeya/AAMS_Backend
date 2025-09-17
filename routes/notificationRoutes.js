// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../middlewares/auth');
const { 
    getUserNotificationsController, 
    markNotificationAsReadController, 
    getUnreadCountController ,
     deleteNotificationController,
  clearNotificationsController
} = require('../controllers/notificationController');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *         description: Page size
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', verifyJwt, getUserNotificationsController);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', verifyJwt, getUnreadCountController);

/**
 * @swagger
 * /api/notifications/{notification_id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:notification_id/read', verifyJwt, markNotificationAsReadController);

module.exports = router;



// added new 


// delete one
router.delete('/:notification_id', verifyJwt, deleteNotificationController);

// clear all
router.delete('/', verifyJwt, clearNotificationsController);