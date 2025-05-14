const express = require('express');
const {getFormDataController, addFormDataController, editFormDataController, deleteFormDataController, getManualTxnsController} = require('../controllers/manualController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')

router.get('/get', verifyJwt, getFormDataController);
router.post('/add/:service_id', verifyJwt, addFormDataController);
router.patch('/edit/:txn_id', verifyJwt, editFormDataController);
router.delete('/delete/:txn_id', verifyJwt, deleteFormDataController);
router.get('/list/:service_id', verifyJwt, getManualTxnsController);
module.exports = router;