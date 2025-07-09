const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const { getOrganizationTypeService,
     getIndustryTypeService,
      getOperationTypeService,
       getPermissionsService,
       getProdPermissionsService,
        getGuidelineVersionService,
         getComplianceLevelService,
          getFrequencyService,
          getScanDaysService,
          getUserStatusService,
          getManualStatusService,
          getPlatformService,
          getAppTypeService,
          getLanguageService,
          getServiceTypeService
        } = require("../services/lookupService");

exports.getOrgTypeController = 
    async (req, res, next) => {
        try {
            const orgTypes = await getOrganizationTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: orgTypes,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getIndustryTypeController = 
    async (req, res, next) => {
        try {
            const industryTypes = await getIndustryTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: industryTypes,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.getServiceTypeController = 
    async (req, res, next) => {
        try {
            const industryTypes = await getServiceTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: serviceTypes,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.getUserStatusController = 
    async (req, res, next) => {
        try {
            const user_status = await getUserStatusService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: user_status,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getOperationTypeController = 
    async (req, res, next) => {
        try {
            const operation_types = await getOperationTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp:operation_types,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getPermissionsController = 
    async (req, res, next) => {
        try {
            const permissions = await getPermissionsService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: permissions,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.getProdPermissionsController = 
    async (req, res, next) => {
        try {
            const prod_permissions = await getProdPermissionsService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: prod_permissions,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getGuidelineVersionController = 
 async (req, res, next) => {
        try {
            const versions = await getGuidelineVersionService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: versions,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getComplianceLevelController = 
    async (req, res, next) => {
           try {
               const level = await getComplianceLevelService();
               const successResponse = SuccessReturnHandler({
                   message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                   resp: level,
               });
               return res.status(STATUS_CODES.SUCCESS).json(successResponse);
              
           } catch (err) {
               next(err)
           }
       };

exports.getFrequencyController = 
    async (req, res, next) => {
           try {
               const frequency = await getFrequencyService();
               const successResponse = SuccessReturnHandler({
                   message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                   resp: frequency,
               });
               return res.status(STATUS_CODES.SUCCESS).json(successResponse);
              
           } catch (err) {
               next(err)
           }
       };
       
exports.getScanDaysController = 
    async (req, res, next) => {
           try {
               const scan_days = await getScanDaysService();
               const successResponse = SuccessReturnHandler({
                   message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                   resp:  scan_days,
               });
               return res.status(STATUS_CODES.SUCCESS).json(successResponse);
              
           } catch (err) {
               next(err)
           }
       };

       exports.getManualStatusController = 
    async (req, res, next) => {
           try {
               const manual_status = await getManualStatusService();
               const successResponse = SuccessReturnHandler({
                   message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                   resp:  manual_status,
               });
               return res.status(STATUS_CODES.SUCCESS).json(successResponse);
              
           } catch (err) {
               next(err)
           }
       };

       exports.getPlatformController = 
       async (req, res, next) => {
              try {
                  const platform = await getPlatformService();
                  const successResponse = SuccessReturnHandler({
                      message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                      resp:  platform,
                  });
                  return res.status(STATUS_CODES.SUCCESS).json(successResponse);
                 
              } catch (err) {
                  next(err)
              }
          };

          exports.getAppTypeController = 
          async (req, res, next) => {
                 try {
                     const app_type = await getAppTypeService();
                     const successResponse = SuccessReturnHandler({
                         message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                         resp:  app_type,
                     });
                     return res.status(STATUS_CODES.SUCCESS).json(successResponse);
                    
                 } catch (err) {
                     next(err)
                 }
             };

             exports.getLanguageController = 
             async (req, res, next) => {
                    try {
                        const language = await getLanguageService();
                        const successResponse = SuccessReturnHandler({
                            message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                            resp:  language,
                        });
                        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
                       
                    } catch (err) {
                        next(err)
                    }
                };
   

