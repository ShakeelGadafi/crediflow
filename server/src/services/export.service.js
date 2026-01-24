const db = require('../config/db');

// Helper to format Date for CSV
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

const getCreditBillsCSV = async () => {
    const query = `
      SELECT b.id, c.full_name as customer, b.bill_no, b.bill_date, b.amount, b.status, b.paid_date
      FROM credit_bills b
      JOIN credit_customers c ON b.customer_id = c.id
      ORDER BY b.bill_date DESC
    `;
    const result = await db.query(query);
    
    // Header
    let csv = 'ID,Customer,Bill No,Bill Date,Amount,Status,Paid Date\n';
    
    // Rows
    result.rows.forEach(row => {
        csv += `${row.id},"${row.customer}",${row.bill_no},${formatDate(row.bill_date)},${row.amount},${row.status},${formatDate(row.paid_date)}\n`;
    });
    
    return csv;
};

const getUtilityBillsCSV = async () => {
    const query = `
      SELECT id, branch_name, bill_type, bill_no, amount, due_date, status, paid_date
      FROM utility_bills
      ORDER BY due_date DESC
    `;
    const result = await db.query(query);
    
    let csv = 'ID,Branch,Type,Bill No,Amount,Due Date,Status,Paid Date\n';
    result.rows.forEach(row => {
        csv += `${row.id},"${row.branch_name}","${row.bill_type}",${row.bill_no},${row.amount},${formatDate(row.due_date)},${row.status},${formatDate(row.paid_date)}\n`;
    });
    
    return csv;
};

const getExpendituresCSV = async () => {
    const query = `
      SELECT e.id, s.name as section, c.name as category, e.amount, e.expense_date, e.description
      FROM expenditures e
      JOIN expenditure_sections s ON e.section_id = s.id
      JOIN expenditure_categories c ON e.category_id = c.id
      ORDER BY e.expense_date DESC
    `;
    const result = await db.query(query);
    
    let csv = 'ID,Section,Category,Amount,Date,Description\n';
    result.rows.forEach(row => {
        csv += `${row.id},"${row.section}","${row.category}",${row.amount},${formatDate(row.expense_date)},"${row.description || ''}"\n`;
    });
    
    return csv;
};

const getSupplierInvoicesCSV = async () => {
    const query = `
      SELECT id, supplier_name, grn_no, invoice_no, invoice_date, amount, due_date, status
      FROM supplier_invoices
      ORDER BY invoice_date DESC
    `;
    const result = await db.query(query);
    
    let csv = 'ID,Supplier,GRN No,Invoice No,Invoice Date,Amount,Due Date,Status\n';
    result.rows.forEach(row => {
        csv += `${row.id},"${row.supplier_name}",${row.grn_no},${row.invoice_no},${formatDate(row.invoice_date)},${row.amount},${formatDate(row.due_date)},${row.status}\n`;
    });
    
    return csv;
};

module.exports = {
    getCreditBillsCSV,
    getUtilityBillsCSV,
    getExpendituresCSV,
    getSupplierInvoicesCSV
};
