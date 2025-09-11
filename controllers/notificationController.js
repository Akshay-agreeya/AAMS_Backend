// controllers/notificationController.js
const { 
    getUserNotificationsService, 
    markNotificationAsReadService, 
    getUnreadCountService 
} = require("../services/notificationService");
const { STATUS_CODES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");

exports.getUserNotificationsController = async (req, res, next) => {
    try {
        const user_id = req.user?.id;
        const { page, size } = req.query;
        
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(size, 10) || 10;

        const notifications = await getUserNotificationsService(user_id, pageNumber, pageSize);
        
        const successResponse = SuccessReturnHandler({
            message: "Notifications retrieved successfully",
            resp: notifications,
        });
        
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};

exports.markNotificationAsReadController = async (req, res, next) => {
    try {
        const { notification_id } = req.params;
        const user_id = req.user?.id;

        await markNotificationAsReadService(notification_id, user_id);
        
        const successResponse = SuccessReturnHandler({
            message: "Notification marked as read",
            resp: { success: true },
        });
        
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};

exports.getUnreadCountController = async (req, res, next) => {
    try {
        const user_id = req.user?.id;
        const count = await getUnreadCountService(user_id);
        
        const successResponse = SuccessReturnHandler({
            message: "Unread count retrieved successfully",
            resp: { unread_count: count },
        });
        
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};