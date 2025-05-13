const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

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

exports.addFormDataService = async (service_id, formData) => {
    try {
      const pool = await getConnectionPool();
      const result = await pool.request()
      .input('ServiceID', sql.Int, service_id)
      .input('AssessmentData', sql.NVarChar(sql.MAX), JSON.stringify(formData))
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