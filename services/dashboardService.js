const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

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