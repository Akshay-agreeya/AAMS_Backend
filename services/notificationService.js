// services/notificationService.js
const { sql, getConnectionPool } = require("../config/db");
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { getDatawithPagination } = require("../utils/helper");

exports.addNotificationService = async (userId, title, message, type = 'info') => {
    try {
        const pool = await getConnectionPool();
        
        const result = await pool.request()
            .input("UserId", sql.UniqueIdentifier, userId)
            .input("Title", sql.NVarChar(255), title) // Changed from VarChar to NVarChar
            .input("Message", sql.NVarChar(500), message) // Changed from VarChar to NVarChar
            .input("Type", sql.NVarChar(50), type) // Changed from VarChar to NVarChar
            .execute("AddNotification_v2"); // Updated procedure name
        
        return result.recordset;
    } catch (err) {
        console.error("Error in addNotificationService:", err);
        throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.getUserNotificationsService = async (userId, pageNumber, pageSize) => {
    try {
        const pool = await getConnectionPool();
        
        const result = await pool.request()
            .input("UserId", sql.UniqueIdentifier, userId)
            .input("PageNumber", sql.Int, pageNumber)
            .input("PageSize", sql.Int, pageSize)
            .execute("GetUserNotifications_v2"); // Updated procedure name
        
        if (!result.recordset.length) {
            return { contents: [], totalPages: 0, totalRecords: 0 };
        }
        
        return getDatawithPagination(result.recordsets);
    } catch (err) {
        console.error("Error in getUserNotificationsService:", err);
        throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.markNotificationAsReadService = async (notificationId, userId) => {
    try {
        const pool = await getConnectionPool();
        
        await pool.request()
            .input("NotificationId", sql.UniqueIdentifier, notificationId)
            .input("UserId", sql.UniqueIdentifier, userId)
            .execute("MarkNotificationAsRead_v2"); // Updated procedure name
        
        return { success: true };
    } catch (err) {
        console.error("Error in markNotificationAsReadService:", err);
        throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.getUnreadCountService = async (userId) => {
    try {
        const pool = await getConnectionPool();
        
        const result = await pool.request()
            .input("UserId", sql.UniqueIdentifier, userId)
            .execute("GetUnreadNotificationsCount_v2"); // Updated procedure name
        
        return result.recordset[0]?.unread_count || 0;
    } catch (err) {
        console.error("Error in getUnreadCountService:", err);
        throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};


// added new 





exports.deleteNotificationService = async (notificationId, userId) => {
  try {
    const pool = await getConnectionPool();
    await pool.request()
      .input("NotificationId", sql.UniqueIdentifier, notificationId)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query("DELETE FROM notifications_v2 WHERE id = @NotificationId AND user_id = @UserId");

    return { success: true };
  } catch (err) {
    console.error("Error in deleteNotificationService:", err);
    throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

exports.clearNotificationsService = async (userId) => {
  try {
    const pool = await getConnectionPool();
    await pool.request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query("DELETE FROM notifications_v2 WHERE user_id = @UserId");

    return { success: true };
  } catch (err) {
    console.error("Error in clearNotificationsService:", err);
    throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};



// exports.deleteNotificationService = async (notificationId, userId) => {
//   try {
//     const pool = await getConnectionPool();

//     await pool.request()
//       .input("NotificationId", sql.UniqueIdentifier, notificationId)
//       .input("UserId", sql.UniqueIdentifier, userId)
//       .execute("DeleteNotification_v2"); // new stored proc (or custom delete query)

//     return { success: true };
//   } catch (err) {
//     console.error("Error in deleteNotificationService:", err);
//     throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// };

// exports.clearNotificationsService = async (userId) => {
//   try {
//     const pool = await getConnectionPool();

//     await pool.request()
//       .input("UserId", sql.UniqueIdentifier, userId)
//       .execute("ClearNotifications_v2"); // deletes all for this user

//     return { success: true };
//   } catch (err) {
//     console.error("Error in clearNotificationsService:", err);
//     throw new AppError(err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
//   }
// };

