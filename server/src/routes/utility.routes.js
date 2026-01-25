const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const utilityController = require('../controllers/utility.controller');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'utility-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const MODULE_KEY = 'DAILY_EXPENDITURE_UTILITIES';

router.use(requireAuth);

router.get(
  '/', 
  requirePermission(MODULE_KEY, 'view'), 
  utilityController.getBills
);

router.post(
  '/', 
  requirePermission(MODULE_KEY, 'create'), 
  upload.single('attachment'), 
  utilityController.createBill
);

router.get(
  '/:id', 
  requirePermission(MODULE_KEY, 'view'), 
  utilityController.getBillById
);

router.patch(
  '/:id/mark-paid', 
  requirePermission(MODULE_KEY, 'update'), 
  utilityController.markBillPaid
);

router.get(
  '/:id/calendar.ics', 
  requirePermission(MODULE_KEY, 'view'), 
  utilityController.generateIcs
);

module.exports = router;
