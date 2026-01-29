const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const supplierController = require('../controllers/supplier.controller');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'supplier-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const MODULE_KEY = 'GRN_CREDIT_REMINDER';

router.use(requireAuth);

router.get(
  '/invoices', 
  requirePermission(MODULE_KEY, 'view'), 
  supplierController.getInvoices
);

router.post(
  '/invoices', 
  requirePermission(MODULE_KEY, 'create'), 
  upload.single('attachment'), 
  supplierController.createInvoice
);

router.get(
  '/invoices/due-soon', 
  requirePermission(MODULE_KEY, 'view'), 
  supplierController.getDueSoon
);

router.get(
  '/invoices/overdue', 
  requirePermission(MODULE_KEY, 'view'), 
  supplierController.getOverdue
);

router.patch(
  '/invoices/:id/mark-paid', 
  requirePermission(MODULE_KEY, 'update'), 
  supplierController.markPaid
);

router.patch(
  '/invoices/:id/status', 
  requirePermission(MODULE_KEY, 'update'), 
  supplierController.updateStatus
);

// PUT /api/suppliers/invoices/:id - Update Invoice
router.put(
  '/invoices/:id', 
  requirePermission(MODULE_KEY, 'update'), 
  upload.single('attachment'),
  supplierController.updateInvoice
);

// DELETE /api/suppliers/invoices/:id - Delete Invoice
router.delete(
  '/invoices/:id', 
  requirePermission(MODULE_KEY, 'delete'), 
  supplierController.deleteInvoice
);

// Optional: View single invoice
router.get(
    '/invoices/:id', 
    requirePermission(MODULE_KEY, 'view'), 
    supplierController.getInvoiceById
  );

module.exports = router;
