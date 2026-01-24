const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const expenditureController = require('../controllers/expenditure.controller');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expenditure-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const MODULE_KEY = 'DAILY_EXPENDITURE_TRACKER';

router.use(requireAuth);

// Sections
router.get(
    '/sections', 
    requirePermission(MODULE_KEY, 'view'), 
    expenditureController.getSections
);
router.post(
    '/sections', 
    requirePermission(MODULE_KEY, 'create'), 
    expenditureController.createSection
);

// Categories
router.get(
    '/sections/:sectionId/categories', 
    requirePermission(MODULE_KEY, 'view'), 
    expenditureController.getCategories
);
router.post(
    '/sections/:sectionId/categories', 
    requirePermission(MODULE_KEY, 'create'), 
    expenditureController.createCategory
);

// Expenditures
router.get(
    '/summary', 
    requirePermission(MODULE_KEY, 'view'), 
    expenditureController.getSummary
);

router.get(
    '/', 
    requirePermission(MODULE_KEY, 'view'), 
    expenditureController.getExpenditures
);

router.post(
    '/', 
    requirePermission(MODULE_KEY, 'create'), 
    upload.single('attachment'), 
    expenditureController.createExpenditure
);

module.exports = router;
