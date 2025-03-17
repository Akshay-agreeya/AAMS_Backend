const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const {getDatawithPagination} = require('../utils/helper')

exports.getCountService = async () => {
  try {
    const pool = await getConnectionPool();
    const countRow = await pool.request()
      .query(`SELECT
      (SELECT COUNT(*) FROM Organization) AS OrgCount,
              (SELECT COUNT(*) FROM Roles) AS RoleCount,
              (SELECT COUNT(*) FROM Users) AS UserCount,
              (SELECT COUNT(*) FROM Assessments) AS ReportCount`);

    if (!countRow.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: countRow.recordset };
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getExpiringService = async (days) => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .input("Days", sql.Int, days)
      .execute("GetExpiringServices");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND, message: "No expiring services found"}
        }
      return {contents: result.recordset}
  }
  catch(err){
      console.error("Database error:", err);
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}