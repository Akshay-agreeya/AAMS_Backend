const express = require('express');
const {getFormDataController, addFormDataController, editFormDataController, deleteFormDataController, getManualTxnsController, getManualReportController} = require('../controllers/manualController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth');
const { validateInputs } = require('../middlewares/validation');
const {manualAssessmentSchema} = require('../utils/validationSchema');

router.get('/get', verifyJwt, getFormDataController);
router.post('/add/:service_id', verifyJwt, validateInputs(manualAssessmentSchema), addFormDataController);
router.patch('/edit/:txn_id', verifyJwt, validateInputs(manualAssessmentSchema), editFormDataController);
router.delete('/delete/:txn_id', verifyJwt, deleteFormDataController);
router.get('/list/:service_id', verifyJwt, getManualTxnsController);
router.get('/viewReport/:txn_id', verifyJwt, getManualReportController);
module.exports = router;