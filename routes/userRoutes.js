const express = require('express');
const { addUserToOrganizationController, editUserCntroller, viewUserController, deleteUserController, getUsersController } = require('../controllers/userController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const { userSchema, editUserSchema } = require('../utils/validationSchema');

router.post('/add/:org_id', verifyJwt, validateInputs(userSchema), addUserToOrganizationController);
router.patch('/edit/:user_id', verifyJwt, validateInputs(editUserSchema), editUserCntroller );
router.get('/get/:user_id', verifyJwt, viewUserController);
router.delete('/delete/:user_id', verifyJwt, deleteUserController);
router.get('/list/:org_id', verifyJwt, getUsersController);

module.exports = router;