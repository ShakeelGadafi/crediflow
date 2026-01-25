const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const exportController = require('../controllers/export.controller');

router.use(requireAuth);

router.get(
    '/credit-bills.csv', 
    requirePermission('CREDIT_TO_COME', 'view'), 
    exportController.exportCreditBills
);

router.get(
    '/utility-bills.csv', 
    requirePermission('DAILY_EXPENDITURE_UTILITIES', 'view'), 
    exportController.exportUtilityBills
);

router.get(
    '/expenditures.csv', 
    requirePermission('DAILY_EXPENDITURE_TRACKER', 'view'), 
    exportController.exportExpenditures
);

router.get(
    '/supplier-invoices.csv', 
    requirePermission('GRN_CREDIT_REMINDER', 'view'), 
    exportController.exportSupplierInvoices
);

module.exports = router;
