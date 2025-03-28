const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const { getDatawithPagination } = require('../utils/helper')

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
    return countRow.recordset?.[0] ?? {};
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getExpiringService = async (days, pageNumber, pageSize) => {
  try {
    const pool = await getConnectionPool();

    const result = await pool.request()
      .input("Days", sql.Int, days)
      .input("PageNumber", sql.Int, pageNumber)
      .input("PageSize", sql.Int, pageSize)
      .execute("GetExpiringServices");
    if (!result.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND, message: "No expiring services found" }
    }
    return getDatawithPagination(result.recordsets);
  }
  catch (err) {
    console.error("Database error:", err);
    if (err.code === "EREQUEST" || err.code === "EPARAM") {
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
    throw new AppError(err.message, err.status);
  }
}

exports.getRecentActivitiesService = async (org_id, days, pageNumber, pageSize) => {
  try {
    const pool = await getConnectionPool();

    const result = await pool.request()
    .input("OrgId", sql.UniqueIdentifier, org_id)
      .input("Days", sql.Int, days)
      .input("PageNumber", sql.Int, pageNumber)
      .input("PageSize", sql.Int, pageSize)
      .execute("GetRecentActivities");
    if (!result.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND, message: "No activity found" }
    }
    return getDatawithPagination(result.recordsets);
  }
  catch (err) {
    console.error("Database error:", err);
    if (err.code === "EREQUEST" || err.code === "EPARAM") {
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
    throw new AppError(err.message, err.status);
  }
}

exports.getSummaryDetailReportService = async (assessment_id) => {
  try {
    const pool = await getConnectionPool();

    const result = await pool.request()
      .input("AssessmentID", sql.Int, assessment_id)
      .execute("GetSummaryDetailReportByAssessmentID");
    if (!result.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND }
    }

    return { contents: result.recordset };
  }
  catch (err) {
    console.error("Database error:", err);
    if (err.code === "EREQUEST" || err.code === "EPARAM") {
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
    throw new AppError(err.message, err.status);
  }
}

exports.getServiceTypeCount = async () => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .execute("GetServiceTypeCount");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND, message: "No service_type found"}
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

exports.getOrgUserCountService = async (org_id) => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .input("OrgID", sql.UniqueIdentifier,org_id)
      .execute("GetOrgUserAndReportCount");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND}
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

exports.getProductCompliance = async () => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .execute("GlobalProductCompliance");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND}
        }
      return {contents: result.recordset?.[0]}
  }
  catch(err){
      console.error("Database error:", err);
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}

