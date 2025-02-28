const express = require('express');
const { addProductController, updateProductController, viewProductController, getProductsController, deleteProductController } = require('../controllers/productController');
const router = express.Router();
const {verifyJwt} = require('../middlewares/auth')
const {validateInputs} = require('../middlewares/validation');
const {productSchema } = require('../utils/validationSchema');

router.post('/add/:org_id', verifyJwt, validateInputs(productSchema), addProductController);
router.patch('/edit/:service_id', verifyJwt,  validateInputs(productSchema), updateProductController);
router.get('/view/:service_id', verifyJwt, viewProductController);
router.get('/get/:org_id', verifyJwt, getProductsController);
router.delete('/delete/:service_id', verifyJwt, deleteProductController);


module.exports = router;