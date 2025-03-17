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
    return {contents: orgTypes.recordset };
  } catch (err) {
    console.error(err);
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
    return {contents: industrytypes.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(err.message, err.status);

  }
};

exports.getUserStatusService = async () => {
  try {
    const pool = await getConnectionPool();
    const user_status = await pool.request()
      .query("SELECT * from User_Status");

    if (!user_status.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: user_status.recordset};
  } catch (err) {
    console.error(err);
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
    return {contents: operation_types.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(err.message, err.status);

  }
};

exports.getPermissionsService = async () => {
  try {
    const pool = await getConnectionPool();
    const permissions = await pool.request()
      .execute("GetPermissions")

    if (!permissions.recordset.length) {
      throw { message: ERROR_MESSAGES.DATA_NOT_FOUND, status: STATUS_CODES.NOT_FOUND };
    }
    const rawJson = permissions.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];
    const parsedJson = JSON.parse(rawJson);
    return {contents: parsedJson};
  } catch (err) {
    console.error(err);
    throw new AppError(err.message, err.status);

  }
};

exports.getProdPermissionsService = async () => {
  try {
    const pool = await getConnectionPool();
    const all_permissions = await pool.request()
      .query("SELECT * from Product_permission_opr");

    if (!all_permissions.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: all_permissions.recordset };
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getGuidelineVersionService = async () => {
  try {
    const pool = await getConnectionPool();
    const guideline = await pool.request()
      .query("SELECT * from Guideline_version");

    if (!guideline.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: guideline.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getComplianceLevelService = async () => {
  try {
    const pool = await getConnectionPool();
    const level = await pool.request()
      .query("SELECT * from Compliance_level");

    if (!level.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: level.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getFrequencyService = async () => {
  try {
    const pool = await getConnectionPool();
    const frequency = await pool.request()
      .query("SELECT * from Frequency ");

    if (!frequency.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: frequency.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};

exports.getScanDaysService = async () => {
  try {
    const pool = await getConnectionPool();
    const days = await pool.request()
      .query("SELECT * from Scan_days ");

    if (!days.recordset.length) {
      throw { status: STATUS_CODES.NOT_FOUND };
    }
    return {contents: days.recordset};
  } catch (err) {
    console.error(err);
    throw new AppError(er.message, err.status);

  }
};