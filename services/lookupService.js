const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

exports.getOrganizationTypeService = async () => {
    try {
    const pool = await getConnectionPool();
    const orgTypes = await pool.request()
    .query("SELECT * from Organization_Type");
     
    if (!orgTypes.recordset.length) {
        throw { status: STATUS_CODES.NOT_FOUND };
    }
    return orgTypes.recordset; 
  } catch (err) {
    console.error( err);
    throw new AppError(er.message, err.status);

  }
};

exports.getIndustryTypeService = async () => {
  try {
  const pool = await getConnectionPool();
  const orgTypes = await pool.request()
  .query("SELECT * from Industry_Type");
   
  if (!orgTypes.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
  }
  return orgTypes.recordset; 
} catch (err) {
  console.error( err);
  throw new AppError(err.message, err.status);

}
};
