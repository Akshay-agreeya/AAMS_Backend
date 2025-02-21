const express = require('express');
const router = express.Router();
const {validateInputs} = require('../middlewares/validation');
const {userLoginAndFPSchema, changePasswordSchema} = require('../utils/validationSchema');
const {verifyJwt} = require('../middlewares/auth')
const {userLoginController, forgotAndResetPasswordController, changePasswordController} = require('../controllers/loginController')

router.post('/login',userLoginController);
router.patch('/user/reset-password', validateInputs(userLoginAndFPSchema),forgotAndResetPasswordController);
router.patch('/user/change-password/', verifyJwt, validateInputs(changePasswordSchema), changePasswordController );

module.exports = router;