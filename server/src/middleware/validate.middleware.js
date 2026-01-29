const { z } = require('zod');

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors 
        });
      }
      
      // Replace with parsed/transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// =====================
// Credit Schemas
// =====================
const createCustomerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateCustomerSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const createBillSchema = z.object({
  bill_no: z.string().max(100).optional().nullable(),
  bill_date: z.string().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
});

const updateBillSchema = z.object({
  bill_no: z.string().max(100).optional().nullable(),
  bill_date: z.string().optional().nullable(),
  amount: z.coerce.number().positive().optional(),
});

// =====================
// Supplier Schemas
// =====================
const createInvoiceSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required').max(255),
  grn_no: z.string().max(100).optional().nullable(),
  invoice_no: z.string().min(1, 'Invoice number is required').max(100),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  credit_days: z.coerce.number().int().min(0).default(30),
  notes: z.string().max(1000).optional().nullable(),
});

const updateInvoiceSchema = z.object({
  supplier_name: z.string().min(1).max(255).optional(),
  grn_no: z.string().max(100).optional().nullable(),
  invoice_no: z.string().min(1).max(100).optional(),
  invoice_date: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  credit_days: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PAID', 'UNPAID', 'PENDING'], { 
    errorMap: () => ({ message: 'Status must be PAID, UNPAID, or PENDING' }) 
  }),
});

// =====================
// Utility Schemas
// =====================
const createUtilityBillSchema = z.object({
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  bill_type: z.string().min(1, 'Bill type is required').max(100),
  bill_no: z.string().max(100).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  due_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateUtilityBillSchema = z.object({
  branch_name: z.string().min(1).max(255).optional(),
  bill_type: z.string().min(1).max(100).optional(),
  bill_no: z.string().max(100).optional().nullable(),
  amount: z.coerce.number().positive().optional(),
  due_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// =====================
// Auth Schemas
// =====================
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const createStaffSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// =====================
// Expenditure Schemas
// =====================
const createSectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

const createExpenditureSchema = z.object({
  section_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive('Amount must be positive'),
  expense_date: z.string().min(1, 'Expense date is required'),
  description: z.string().max(1000).optional().nullable(),
});

module.exports = {
  validate,
  // Credit
  createCustomerSchema,
  updateCustomerSchema,
  createBillSchema,
  updateBillSchema,
  // Supplier
  createInvoiceSchema,
  updateInvoiceSchema,
  updateStatusSchema,
  // Utility
  createUtilityBillSchema,
  updateUtilityBillSchema,
  // Auth
  loginSchema,
  createStaffSchema,
  // Expenditure
  createSectionSchema,
  createCategorySchema,
  createExpenditureSchema,
};
