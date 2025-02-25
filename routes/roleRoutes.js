const express = require('express');
const {  getRolesController, addRoleAndDetailsController, updateRoleAndDetailsController } = require('../controllers/roleController');
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const {roleSchema} = require('../utils/validationSchema');
const router = express.Router();

router.get('/list', verifyJwt, getRolesController);
router.post('/add', verifyJwt, validateInputs(roleSchema), addRoleAndDetailsController);
router.patch('/edit/:role_id', verifyJwt, validateInputs(roleSchema), updateRoleAndDetailsController);

module.exports = router;