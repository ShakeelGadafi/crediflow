const db = require('../config/db');

// 1) Customer list with total outstanding
const getCustomers = async (search) => {
  let query = `
    SELECT
      c.*,
      COALESCE(SUM(CASE WHEN b.status = 'UNPAID' THEN b.amount ELSE 0 END), 0) AS total_unpaid
    FROM credit_customers c
    LEFT JOIN credit_bills b ON b.customer_id = c.id
  `;

  const params = [];
  
  if (search) {
    query += ` WHERE c.full_name ILIKE $1 OR c.phone ILIKE $1 `;
    params.push(`%${search}%`);
  }

  query += `
    GROUP BY c.id
    ORDER BY c.created_at DESC;
  `;
  
  const result = await db.query(query, params);
  return result.rows;
};

const createCustomer = async (data) => {
  const { full_name, phone, address, notes } = data;
  const result = await db.query(
    'INSERT INTO credit_customers (full_name, phone, address, notes) VALUES ($1, $2, $3, $4) RETURNING *',
    [full_name, phone, address, notes]
  );
  return result.rows[0];
};

// 2) Customer details with totals (paid/unpaid)
const getCustomerById = async (id) => {
  // Fetch customer details
  const customerResult = await db.query('SELECT * FROM credit_customers WHERE id = $1', [id]);
  const customer = customerResult.rows[0];

  if (!customer) return null;

  // Calculate totals
  const totalsQuery = `
    SELECT
      COALESCE(SUM(CASE WHEN status='UNPAID' THEN amount ELSE 0 END), 0) AS total_unpaid,
      COALESCE(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END), 0) AS total_paid
    FROM credit_bills
    WHERE customer_id = $1;
  `;
  const totalsResult = await db.query(totalsQuery, [id]);
  const totals = totalsResult.rows[0];

  return { ...customer, ...totals };
};

const getBillsByCustomerId = async (customerId) => {
  const result = await db.query(
    'SELECT * FROM credit_bills WHERE customer_id = $1 ORDER BY bill_date DESC, created_at DESC',
    [customerId]
  );
  return result.rows;
};

const createBill = async (data) => {
  const { customer_id, bill_no, bill_date, amount, attachment_url } = data;
  const result = await db.query(
    `INSERT INTO credit_bills (customer_id, bill_no, bill_date, amount, status, attachment_url)
     VALUES ($1, $2, $3, $4, 'UNPAID', $5)
     RETURNING *`,
    [customer_id, bill_no, bill_date, amount, attachment_url]
  );
  return result.rows[0];
};

// 3) Mark bill paid
const markBillPaid = async (billId) => {
  const result = await db.query(
    "UPDATE credit_bills SET status='PAID', paid_date=CURRENT_DATE WHERE id=$1 RETURNING *",
    [billId]
  );
  return result.rows[0];
};

const markBillUnpaid = async (billId) => {
  const result = await db.query(
    "UPDATE credit_bills SET status='UNPAID', paid_date=NULL WHERE id=$1 RETURNING *",
    [billId]
  );
  return result.rows[0];
};

const deleteCustomer = async (id) => {
  // First delete all bills associated with the customer
  await db.query('DELETE FROM credit_bills WHERE customer_id = $1', [id]);
  // Then delete the customer
  const result = await db.query(
    'DELETE FROM credit_customers WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

const updateCustomer = async (id, data) => {
  const { full_name, phone, address, notes } = data;
  const result = await db.query(
    `UPDATE credit_customers 
     SET full_name = COALESCE($1, full_name), 
         phone = COALESCE($2, phone), 
         address = COALESCE($3, address), 
         notes = COALESCE($4, notes)
     WHERE id = $5 RETURNING *`,
    [full_name, phone, address, notes, id]
  );
  return result.rows[0];
};

const updateBill = async (billId, data) => {
  const { bill_no, bill_date, amount } = data;
  const result = await db.query(
    `UPDATE credit_bills 
     SET bill_no = COALESCE($1, bill_no), 
         bill_date = COALESCE($2, bill_date), 
         amount = COALESCE($3, amount)
     WHERE id = $4 RETURNING *`,
    [bill_no, bill_date, amount, billId]
  );
  return result.rows[0];
};

const deleteBill = async (billId) => {
  const result = await db.query(
    'DELETE FROM credit_bills WHERE id = $1 RETURNING *',
    [billId]
  );
  return result.rows[0];
};

module.exports = {
  getCustomers,
  createCustomer,
  getCustomerById,
  getBillsByCustomerId,
  createBill,
  markBillPaid,
  markBillUnpaid,
  deleteCustomer,
  updateCustomer,
  updateBill,
  deleteBill,
};
