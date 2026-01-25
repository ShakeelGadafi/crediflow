const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// Apply auth and admin check to all routes
router.use(requireAuth, requireAdmin);

router.post('/staff', adminController.createStaff);
router.get('/staff', adminController.getAllStaff);
router.patch('/staff/:id', adminController.activateStaff); // Using PATCH for partial update (status)
router.get('/modules', adminController.getModules);
router.put('/staff/:id/permissions', adminController.updateStaffPermissions);

module.exports = router;
