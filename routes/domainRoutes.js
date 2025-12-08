const express = require('express');
const {
    registerDomainController,
    updateDomainController,
    deleteDomainController,
    getDomainController,
    getAllDomainsController
} = require('../controllers/domainController');
const { verifyJwt } = require('../middlewares/auth');

const router = express.Router();

// Register a new domain
router.post('/register', registerDomainController);

router.put('/update/:scan_id', updateDomainController);

router.delete('/delete/:scan_id', deleteDomainController);


module.exports = router;