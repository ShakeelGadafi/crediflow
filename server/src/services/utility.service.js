const db = require('../config/db');

const getBills = async (filters) => {
  let query = 'SELECT * FROM utility_bills';
  const params = [];
  const constraints = [];

  if (filters.branch_name) {
    constraints.push(`branch_name ILIKE $${params.length + 1}`);
    params.push(`%${filters.branch_name}%`);
  }

  if (filters.status) {
    constraints.push(`status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters.startDate) {
    constraints.push(`due_date >= $${params.length + 1}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    constraints.push(`due_date <= $${params.length + 1}`);
    params.push(filters.endDate);
  }

  if (filters.search) {
    const searchParam = `%${filters.search}%`;
    constraints.push(`(
      branch_name ILIKE $${params.length + 1} OR 
      bill_type ILIKE $${params.length + 2} OR 
      bill_no ILIKE $${params.length + 3}
    )`);
    params.push(searchParam);
    params.push(searchParam);
    params.push(searchParam);
  }

  if (constraints.length > 0) {
    query += ' WHERE ' + constraints.join(' AND ');
  }

  query += ' ORDER BY due_date ASC, created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
};

const createBill = async (data) => {
  const { branch_name, bill_type, bill_no, amount, due_date, notes, attachment_url } = data;
  const result = await db.query(
    `INSERT INTO utility_bills (branch_name, bill_type, bill_no, amount, due_date, notes, attachment_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNPAID')
     RETURNING *`,
    [branch_name, bill_type, bill_no, amount, due_date, notes, attachment_url]
  );
  return result.rows[0];
};

const getBillById = async (id) => {
  const result = await db.query('SELECT * FROM utility_bills WHERE id = $1', [id]);
  return result.rows[0];
};

const markBillPaid = async (id) => {
  const result = await db.query(
    "UPDATE utility_bills SET status='PAID', paid_date=CURRENT_DATE WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getBills,
  createBill,
  getBillById,
  markBillPaid,
};
