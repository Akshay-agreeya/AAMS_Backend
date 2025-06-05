const {freeLightAssementService} = require('../services/freeLightAssessmentService');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { STATUS_CODES } = require('../utils/errorCodes');

exports.freeLightAssementController = async (req, res) => {
      const { service_id, org_id,freeLiteAssessmentUrl } = req.body
    
      try {
        const result = await freeLightAssementService(service_id, org_id,freeLiteAssessmentUrl);
        const successResponse = SuccessReturnHandler({
          message: SUCCESS_MESSAGES.EXTRACT_REPORT_SUCCESS,
          resp: result,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
      } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({
          status: 'error',
          message: 'Error processing upload',
          details: err.message
        });
      }
    };
