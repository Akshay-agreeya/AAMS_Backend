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
    console.error("Database Error:", error);
    throw new AppError(error.message, STATUS_CODES.BAD_REQUEST);

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
  console.error("Database Error:", error);
  throw new AppError(error.message, STATUS_CODES.BAD_REQUEST);

}
};
