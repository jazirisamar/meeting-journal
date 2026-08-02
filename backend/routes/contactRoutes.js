const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;