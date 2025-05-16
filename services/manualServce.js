const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const {getDatawithPagination} = require("../utils/helper")

exports.getFormDataService = async () => {
    try {
      const pool = await getConnectionPool();
      const categories = await pool.request()
        .execute("GetManualAssessmentJson")
  
      if (!categories.recordset.length) {
        throw { message: ERROR_MESSAGES.DATA_NOT_FOUND, status: STATUS_CODES.NOT_FOUND };
      }
      const rawJson = categories.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];
      const parsedJson = JSON.parse(rawJson);
      return {contents: parsedJson};
    } catch (err) {
      console.error(err);
      throw new AppError(err.message, err.status);
  
    }
  };

exports.addFormDataService = async (service_id, assessmentData, created_by) => {
    try {
      const pool = await getConnectionPool();
      const result = await pool.request()
      .input('ServiceID', sql.Int, service_id)
      .input('AssessmentData', sql.NVarChar(sql.MAX), JSON.stringify(assessmentData))
      .input('CreatedBy', sql.UniqueIdentifier, created_by)
      .output('TxnID', sql.Int)
      .execute("InsertManualAssessmentsWithTxn")

      const txnId = result.output.TxnID;

      if (!txnId) {
        throw { message: ERROR_MESSAGES.DATA_NOT_FOUND, status: STATUS_CODES.NOT_FOUND };
      }
      return {txn: txnId};
    } catch (err) {
      console.error(err);
      throw new AppError(err.message, err.status);
  
    }
  };

  exports.editFormDataService = async (txn_id, assessmentData, modified_by) => {
    try {
      const pool = await getConnectionPool();
      const result = await pool.request()
      .input('TxnID', sql.Int, txn_id)
      .input('AssessmentData', sql.NVarChar(sql.MAX), JSON.stringify(assessmentData))
      .input('ModifiedBy', sql.UniqueIdentifier, modified_by)
      .execute("UpdateManualAssessments");

      return result;
    } catch (err) {
      console.error(err);
      throw new AppError(err.message, err.status);
  
    }
  };

  
 exports.deleteformDataService = async(txn_id) =>{
  try{
    const pool = await getConnectionPool();

    const result = await pool.request()
    .input("TxnID", sql.Int, txn_id)
    .execute("DeleteManualReport");

    return result.recordset;

  }catch(err){
    console.error(err);
    if (err.code === 'EREQUEST' || err.code === 'EPARAM') {
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); 
  }
  throw new AppError(err.message,err.status);
  }
}

exports.getManualTxnsService = async (service_id, pageNumber, pageSize) => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .input("ServiceID", sql.Int, service_id)
      .input("PageNumber", sql.Int, pageNumber)
      .input("PageSize", sql.Int, pageSize)
      .execute("GetManualTxnsByServiceID");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
        }
      return getDatawithPagination(result.recordsets);
  }
  catch(err){
      console.error("Database error:", err);
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}

exports.getManualReportService = async (txn_id) => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .input("txn_id", sql.Int, txn_id)
      .execute("GetManualAssessmentReportJson");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
        }
        const rawJson = result.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];
        const parsedJson = JSON.parse(rawJson);
        return {contents: parsedJson};
  }
  catch(err){
      console.error("Database error:", err);
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}