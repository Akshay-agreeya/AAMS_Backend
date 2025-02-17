const express = require('express');
const router = express.Router();
const {validateInputs} = require('../middlewares/validation');
const {userLoginAndFPSchema} = require('../utils/validationSchema');
const {userLoginController, forgotAndResetPasswordController, changePasswordController} = require('../controllers/loginController')

router.post('/login',validateInputs(userLoginAndFPSchema),userLoginController);
router.patch('/user/reset-password', validateInputs(userLoginAndFPSchema),forgotAndResetPasswordController);
router.patch('/user/change-password/:user_id',changePasswordController );

module.exports = router;