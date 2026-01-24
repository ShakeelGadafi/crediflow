const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(requireAuth);

router.get(
    '/credit', 
    requirePermission('CREDIT_TO_COME', 'view'), 
    dashboardController.getCreditStats
);

router.get(
    '/utilities', 
    requirePermission('DAILY_EXPENDITURE_UTILITIES', 'view'), 
    dashboardController.getUtilityStats
);

router.get(
    '/expenditure', 
    requirePermission('DAILY_EXPENDITURE_TRACKER', 'view'), 
    dashboardController.getExpenditureStats
);

router.get(
    '/suppliers', 
    requirePermission('GRN_CREDIT_REMINDER', 'view'), 
    dashboardController.getSupplierStats
);

module.exports = router;
