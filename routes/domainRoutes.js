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

// Get a specific domain by scan_id
router.get('/:scan_id', getDomainController);

// Get all domains
router.get('/', getAllDomainsController);

// Update a domain
router.put('/:scan_id', updateDomainController);

// Delete a domain
router.delete('/:scan_id', deleteDomainController);

module.exports = router;