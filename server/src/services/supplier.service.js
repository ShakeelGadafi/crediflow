const db = require('../config/db');

const calculateDueDate = (invoiceDate, creditDays) => {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + parseInt(creditDays, 10));
  return date.toISOString().split('T')[0];
};

const createInvoice = async (data) => {
  const { 
    supplier_name, grn_no, invoice_no, invoice_date, 
    amount, credit_days, notes, attachment_url 
  } = data;

  const due_date = calculateDueDate(invoice_date, credit_days);

  const result = await db.query(
    `INSERT INTO supplier_invoices 
     (supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, due_date, notes, attachment_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UNPAID')
     RETURNING *`,
    [supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, due_date, notes, attachment_url]
  );
  return result.rows[0];
};

const getInvoices = async (filters) => {
  let query = 'SELECT * FROM supplier_invoices';
  const params = [];
  const constraints = [];

  if (filters.supplier_name) {
    constraints.push(`supplier_name ILIKE $${params.length + 1}`);
    params.push(`%${filters.supplier_name}%`);
  }

  if (filters.status) {
    constraints.push(`status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters.from) {
    constraints.push(`invoice_date >= $${params.length + 1}`);
    params.push(filters.from);
  }

  if (filters.to) {
    constraints.push(`invoice_date <= $${params.length + 1}`);
    params.push(filters.to);
  }

  if (filters.search) {
    constraints.push(`(invoice_no ILIKE $${params.length + 1} OR grn_no ILIKE $${params.length + 1})`);
    params.push(`%${filters.search}%`);
  }

  if (constraints.length > 0) {
    query += ' WHERE ' + constraints.join(' AND ');
  }

  query += ' ORDER BY due_date ASC, created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
};

const getInvoicesDueSoon = async (days = 7) => {
  const result = await db.query(
    `SELECT * FROM supplier_invoices 
     WHERE status = 'UNPAID' 
     AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '${days} days')
     ORDER BY due_date ASC`,
  );
  return result.rows;
};

const getOverdueInvoices = async () => {
  const result = await db.query(
    `SELECT * FROM supplier_invoices 
     WHERE status = 'UNPAID' 
     AND due_date < CURRENT_DATE
     ORDER BY due_date ASC`,
  );
  return result.rows;
};

const markPaid = async (id) => {
  const result = await db.query(
    "UPDATE supplier_invoices SET status='PAID', paid_date=CURRENT_DATE WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const getInvoiceById = async (id) => {
  const result = await db.query('SELECT * FROM supplier_invoices WHERE id = $1', [id]);
  return result.rows[0];
};

const updateStatus = async (id, status) => {
  const validStatuses = ['PAID', 'UNPAID', 'PENDING'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }
  
  const paid_date = status === 'PAID' ? 'CURRENT_DATE' : 'NULL';
  const result = await db.query(
    `UPDATE supplier_invoices SET status=$1, paid_date=${paid_date} WHERE id=$2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

const updateInvoice = async (id, data) => {
  const { supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, notes } = data;
  
  // Calculate new due date if invoice_date or credit_days changed
  let due_date = null;
  if (invoice_date && credit_days !== undefined) {
    due_date = calculateDueDate(invoice_date, credit_days);
  }
  
  const result = await db.query(
    `UPDATE supplier_invoices 
     SET supplier_name = COALESCE($1, supplier_name), 
         grn_no = COALESCE($2, grn_no), 
         invoice_no = COALESCE($3, invoice_no), 
         invoice_date = COALESCE($4, invoice_date), 
         amount = COALESCE($5, amount),
         credit_days = COALESCE($6, credit_days),
         notes = COALESCE($7, notes),
         due_date = COALESCE($8, due_date)
     WHERE id = $9 RETURNING *`,
    [supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, notes, due_date, id]
  );
  return result.rows[0];
};

const deleteInvoice = async (id) => {
  const result = await db.query(
    'DELETE FROM supplier_invoices WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoicesDueSoon,
  getOverdueInvoices,
  markPaid,
  updateStatus,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
