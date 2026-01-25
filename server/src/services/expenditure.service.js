const db = require('../config/db');

// --- Sections ---

const getSections = async () => {
  const result = await db.query('SELECT * FROM expenditure_sections ORDER BY name');
  return result.rows;
};

const createSection = async (name) => {
  const result = await db.query(
    'INSERT INTO expenditure_sections (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

// --- Categories ---

const getCategories = async (sectionId) => {
  const result = await db.query(
    'SELECT * FROM expenditure_categories WHERE section_id = $1 ORDER BY name',
    [sectionId]
  );
  return result.rows;
};

const createCategory = async (sectionId, name) => {
  const result = await db.query(
    'INSERT INTO expenditure_categories (section_id, name) VALUES ($1, $2) RETURNING *',
    [sectionId, name]
  );
  return result.rows[0];
};

// --- Expenditures ---

const createExpenditure = async (data) => {
  const { section_id, category_id, amount, expense_date, description, attachment_url } = data;
  
  // Validate category belongs to section
  const validCategory = await db.query(
    'SELECT id FROM expenditure_categories WHERE id = $1 AND section_id = $2',
    [category_id, section_id]
  );

  if (validCategory.rows.length === 0) {
    throw new Error('Category does not belong to the specified section');
  }

  const result = await db.query(
    `INSERT INTO expenditures 
     (section_id, category_id, amount, expense_date, description, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [section_id, category_id, amount, expense_date, description, attachment_url]
  );
  return result.rows[0];
};

const getExpenditures = async (filters) => {
  let query = `
    SELECT e.*, s.name as section_name, c.name as category_name
    FROM expenditures e
    JOIN expenditure_sections s ON e.section_id = s.id
    JOIN expenditure_categories c ON e.category_id = c.id
  `;
  
  const params = [];
  const constraints = [];

  if (filters.sectionId) {
    constraints.push(`e.section_id = $${params.length + 1}`);
    params.push(filters.sectionId);
  }

  if (filters.categoryId) {
    constraints.push(`e.category_id = $${params.length + 1}`);
    params.push(filters.categoryId);
  }

  if (filters.from) {
    constraints.push(`e.expense_date >= $${params.length + 1}`);
    params.push(filters.from);
  }

  if (filters.to) {
    constraints.push(`e.expense_date <= $${params.length + 1}`);
    params.push(filters.to);
  }

  if (constraints.length > 0) {
    query += ' WHERE ' + constraints.join(' AND ');
  }

  query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
};

const getSummary = async (from, to) => {
  const dateConstraints = [];
  const params = [];
  
  if (from) {
    dateConstraints.push(`expense_date >= $${params.length + 1}`);
    params.push(from);
  }
  if (to) {
    dateConstraints.push(`expense_date <= $${params.length + 1}`);
    params.push(to);
  }
  
  const whereSql = dateConstraints.length > 0 ? 'WHERE ' + dateConstraints.join(' AND ') : '';

  // 1. Grand Total
  const q1 = `SELECT COALESCE(SUM(amount), 0) as total FROM expenditures ${whereSql}`;
  const r1 = await db.query(q1, params);
  
  // 2. By Section
  const q2 = `
    SELECT s.id as section_id, s.name as section_name, COALESCE(SUM(e.amount), 0) as total
    FROM expenditures e
    JOIN expenditure_sections s ON e.section_id = s.id
    ${whereSql}
    GROUP BY s.id, s.name
    ORDER BY total DESC
  `;
  const r2 = await db.query(q2, params);

  // 3. By Category
  const q3 = `
    SELECT s.name as section_name, c.name as category_name, COALESCE(SUM(e.amount), 0) as total
    FROM expenditures e
    JOIN expenditure_sections s ON e.section_id = s.id
    JOIN expenditure_categories c ON e.category_id = c.id
    ${whereSql}
    GROUP BY s.id, s.name, c.id, c.name
    ORDER BY total DESC
  `;
  const r3 = await db.query(q3, params);

  // 4. By Month
  const q4 = `
    SELECT TO_CHAR(expense_date, 'YYYY-MM') as month, COALESCE(SUM(amount), 0) as total
    FROM expenditures
    ${whereSql}
    GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
    ORDER BY month DESC
  `;
  const r4 = await db.query(q4, params);

  return {
    grand_total: r1.rows[0].total,
    totals_by_section: r2.rows,
    totals_by_category: r3.rows,
    totals_by_month: r4.rows
  };
};

const deleteSection = async (id) => {
  const result = await db.query('DELETE FROM expenditure_sections WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

const deleteCategory = async (id) => {
  const result = await db.query('DELETE FROM expenditure_categories WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

const deleteExpenditure = async (id) => {
  const result = await db.query('DELETE FROM expenditures WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getSections,
  createSection,
  deleteSection,
  getCategories,
  createCategory,
  deleteCategory,
  createExpenditure,
  getExpenditures,
  deleteExpenditure,
  getSummary
};
