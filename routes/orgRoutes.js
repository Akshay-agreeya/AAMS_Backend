const express = require('express');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const {addOrganizationController, getOrganizationByIdController} = require('../controllers/organizationController');
const { addOrgSchema } = require('../utils/validationSchema');

router.post('/add', verifyJwt, validateInputs(addOrgSchema), addOrganizationController);
router.get('/get/:org_id', getOrganizationByIdController);

module.exports = router;