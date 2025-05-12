const express = require('express');
const {getFormDataController, addFormDataController} = require('../controllers/manualController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')

router.get('/get', verifyJwt, getFormDataController);
router.post('/add',addFormDataController);
module.exports = router;