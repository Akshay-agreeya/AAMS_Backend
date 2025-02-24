const express = require('express');
const {  getRolesController, addRoleAndDetailsController, updateRoleAndDetailsController } = require('../controllers/roleController');
const {verifyJwt} = require('../middlewares/auth')
const router = express.Router();

router.get('/list', verifyJwt, getRolesController);
router.post('/add', verifyJwt, addRoleAndDetailsController);
router.patch('/edit/:role_id', verifyJwt, updateRoleAndDetailsController);

module.exports = router;