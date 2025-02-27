const express = require('express');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const {addOrganizationController, getOrganizationByIdController, editOrganizationController, deleteOrgController, getOrganizationsController} = require('../controllers/organizationController');
const { orgSchema } = require('../utils/validationSchema');

router.post('/add', verifyJwt, validateInputs(orgSchema), addOrganizationController);
router.get('/get/:org_id', verifyJwt, getOrganizationByIdController);
router.patch('/edit/:org_id',verifyJwt, validateInputs(orgSchema), editOrganizationController);
router.delete('/delete',verifyJwt, deleteOrgController);
router.get('/list',verifyJwt, getOrganizationsController);

module.exports = router;