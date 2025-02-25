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
  const industrytypes = await pool.request()
  .query("SELECT * from Industry_Type");
   
  if (!industrytypes.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
  }
  return industrytypes.recordset; 
} catch (err) {
  console.error( err);
  throw new AppError(err.message, err.status);

}
};

exports.getOperationTypeService = async () => {
  try {
  const pool = await getConnectionPool();
  const operation_types = await pool.request()
  .query("SELECT * from Operation_Types");
   
  if (!operation_types.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
  }
  return operation_types.recordset; 
} catch (err) {
  console.error( err);
  throw new AppError(err.message, err.status);

}
};

exports.getPermissionsService = async () => {
  try {
  const pool = await getConnectionPool();
  const permissions = await pool.request()
 .execute("GetPermissions")
   
  if (!permissions.recordset.length) {
      throw {  message: ERROR_MESSAGES.DATA_NOT_FOUND, status: STATUS_CODES.NOT_FOUND };
  }
  const rawJson = permissions.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];
  const parsedJson = JSON.parse(rawJson);
  return parsedJson; 
} catch (err) {
  console.error( err);
  throw new AppError(err.message, err.status);

}
};