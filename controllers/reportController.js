const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const { getWebUrlsService, getAssessmentsService, getCategoryDataService, getUserWebUrlsService, insertCategoryAndDetailsService, updateCategoryAndDetailsService, deleteCategoryReport, getMobileScreenReportService, getMobileruleResultsService, getScreenshotService } = require("../services/reportsService");

exports.getWebUrlsController = async(req,res,next) =>{
    const {org_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const urls = await getWebUrlsService(org_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getUserWebUrlsController = async(req,res,next) =>{
    const user_id = req.user?.id;
    const { page, size, permission_name } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const user_urls = await getUserWebUrlsService(user_id, pageNumber, pageSize, permission_name);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: user_urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getAssessmentsController = async(req,res,next) =>{
    const {service_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const urls = await getAssessmentsService(service_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getCategoryDataController = async(req,res,next) =>{
    const {assessment_id} = req.params;

    try{
        const categoryData = await getCategoryDataService(assessment_id)

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp:  categoryData,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.insertCategoryAndDetails = async (req, res, next) => {
    const categoryDetails = req.body;
  
    try {
      const { categoryId}  = await insertCategoryAndDetailsService(
        categoryDetails
      );
  
      const response = SuccessReturnHandler({
        message: "Category and details inserted successfully.",
        resp: { categoryId },
      });
  
      res.status(STATUS_CODES.CREATED).json(response);
    } catch (err) {
      next(err);
    }
  };

exports.updateCategoryAndDetails = async (req, res, next) => {
    const {category_id} = req.params;
    const categoryDetails = req.body;
  
    try {
      const updatedData  = await updateCategoryAndDetailsService(
        category_id, categoryDetails
      );
  
      const response = SuccessReturnHandler({
        message: "Category and details updated successfully.",
        resp: updatedData,
      });
  
      res.status(STATUS_CODES.SUCCESS).json(response);
    } catch (err) {
      next(err);
    }
  };

  exports.deleteCategoryReportController = async(req,res,next)=>{
      const {category_id} = req.params;
      try {
        const deletedData  = await deleteCategoryReport(category_id)
    
        const response = SuccessReturnHandler({
          message: "Category and details deleted successfully.",
          resp: deletedData,
        });
    
        res.status(STATUS_CODES.SUCCESS).json(response);
      } catch (err) {
        next(err);
      }
  }

  exports.getMobileScreenReportController = async(req,res,next) =>{
    const {summary_report_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const screenData = await getMobileScreenReportService(summary_report_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: screenData,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getMobileRuleResultsController = async(req,res,next) =>{
  const {mobile_screen_report_id} = req.params;
  const { page, size, status } = req.query;
  
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(size, 10) || 10;


  try{
      const ruleResults = await getMobileruleResultsService(mobile_screen_report_id, status, pageNumber, pageSize);

      const successResponse = SuccessReturnHandler({
          message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
          resp: ruleResults,
      });
      res.status(STATUS_CODES.SUCCESS).json(successResponse);
  }catch(err){
      next(err);
  }
}

exports.getScreenshotController = async (req, res, next) => {
  try{
      const {mobile_screen_report_id} = req.params;
      const {imageBuffer, mimeType} = await getScreenshotService(mobile_screen_report_id)
      res.set('Content-Type', mimeType);
      res.send(imageBuffer);
      return res.status(STATUS_CODES.SUCCESS);
  }catch(err){
      next(err)
  }
}