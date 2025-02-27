const express = require('express');
const { addProductController, updateProductController } = require('../controllers/productController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const {productSchema } = require('../utils/validationSchema');

router.post('/add/:org_id', verifyJwt, validateInputs(productSchema), addProductController);
router.patch('/edit/:service_id', verifyJwt,  validateInputs(productSchema), updateProductController);


module.exports = router;