const db = require('../config/db');

// 1. Credit Dashboard
const getCreditStats = async () => {
    // Total Customers
    // Total Unpaid Amount
    // Total Paid Amount (All time)
    const query = `
      SELECT
        COUNT(DISTINCT c.id) as total_customers,
        COALESCE(SUM(CASE WHEN b.status = 'UNPAID' THEN b.amount ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN b.status = 'PAID' THEN b.amount ELSE 0 END), 0) as total_collected
      FROM credit_customers c
      LEFT JOIN credit_bills b ON c.id = b.customer_id
    `;
    const result = await db.query(query);
    return result.rows[0];
};

// 2. Utility Dashboard
const getUtilityStats = async (days = 7) => {
    // Bills due soon
    const dueSoon = await db.query(
        `SELECT * FROM utility_bills 
         WHERE status = 'UNPAID' 
         AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '${days} days')
         ORDER BY due_date ASC`
    );
    
    // Total Unpaid
    const totalUnpaid = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as total_unpaid FROM utility_bills WHERE status = 'UNPAID'"
    );

    return {
        due_soon: dueSoon.rows,
        total_unpaid: totalUnpaid.rows[0].total_unpaid
    };
};

// 3. Expenditure Dashboard
const getExpenditureStats = async (from, to) => {
    // Already have a summary service in expenditure.service.js, but let's make a dashboard specific concise one
    // Total in range
    // Section breakdown
    const params = [];
    let dateFilter = '';
    
    if (from && to) {
        dateFilter = 'WHERE expense_date >= $1 AND expense_date <= $2';
        params.push(from, to);
    }

    const totalRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenditures ${dateFilter}`,
        params
    );

    const sectionRes = await db.query(
        `SELECT s.name, COALESCE(SUM(e.amount), 0) as total
         FROM expenditures e
         JOIN expenditure_sections s ON e.section_id = s.id
         ${dateFilter}
         GROUP BY s.name
         ORDER BY total DESC
         LIMIT 5`,
        params
    );

    return {
        total: totalRes.rows[0].total,
        by_top_sections: sectionRes.rows
    };
};

// 4. Supplier Dashboard
const getSupplierStats = async (days = 7) => {
    // Overdue Count & Amount
    const overdue = await db.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
         FROM supplier_invoices 
         WHERE status = 'UNPAID' AND due_date < CURRENT_DATE`
    );

    // Due Soon
    const dueSoon = await db.query(
        `SELECT * FROM supplier_invoices 
         WHERE status = 'UNPAID' 
         AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '${days} days')
         ORDER BY due_date ASC`
    );

    return {
        overdue_summary: overdue.rows[0],
        due_soon: dueSoon.rows
    };
};

module.exports = {
    getCreditStats,
    getUtilityStats,
    getExpenditureStats,
    getSupplierStats
};
