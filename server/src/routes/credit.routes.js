const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const creditController = require('../controllers/credit.controller');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const MODULE_KEY = 'CREDIT_TO_COME';

// All routes require authentication
router.use(requireAuth);

// Routes

// GET /api/credit/customers - View List
router.get(
  '/customers',
  requirePermission(MODULE_KEY, 'view'),
  creditController.getCustomers
);

// POST /api/credit/customers - Create Customer
router.post(
  '/customers',
  requirePermission(MODULE_KEY, 'create'),
  creditController.createCustomer
);

// GET /api/credit/customers/:id - View Detail
router.get(
  '/customers/:id',
  requirePermission(MODULE_KEY, 'view'),
  creditController.getCustomerById
);

// GET /api/credit/customers/:id/bills - View Bills
router.get(
  '/customers/:id/bills',
  requirePermission(MODULE_KEY, 'view'),
  creditController.getBills
);

// POST /api/credit/customers/:id/bills - Create Bill
router.post(
  '/customers/:id/bills',
  requirePermission(MODULE_KEY, 'update'), // Conceptual decision: Adding a bill updates the customer's credit record
  upload.single('attachment'),
  creditController.createBill
);

// PATCH /api/credit/bills/:billId/mark-paid - Mark Paid
router.patch(
  '/bills/:billId/mark-paid',
  requirePermission(MODULE_KEY, 'update'),
  creditController.markBillPaid
);

// PATCH /api/credit/bills/:billId/mark-unpaid - Mark Unpaid
router.patch(
  '/bills/:billId/mark-unpaid',
  requirePermission(MODULE_KEY, 'update'),
  creditController.markBillUnpaid
);

// DELETE /api/credit/customers/:id - Delete Customer
router.delete(
  '/customers/:id',
  requirePermission(MODULE_KEY, 'delete'),
  creditController.deleteCustomer
);

// PUT /api/credit/customers/:id - Update Customer
router.put(
  '/customers/:id',
  requirePermission(MODULE_KEY, 'update'),
  creditController.updateCustomer
);

// PUT /api/credit/bills/:billId - Update Bill
router.put(
  '/bills/:billId',
  requirePermission(MODULE_KEY, 'update'),
  creditController.updateBill
);

// DELETE /api/credit/bills/:billId - Delete Bill
router.delete(
  '/bills/:billId',
  requirePermission(MODULE_KEY, 'delete'),
  creditController.deleteBill
);

module.exports = router;
