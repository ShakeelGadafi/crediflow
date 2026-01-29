const db = require('../config/db');
const XLSX = require('xlsx');

// Helper to format Date
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

const getCreditBillsExcel = async () => {
    const query = `
      SELECT b.id, c.full_name as customer, b.bill_no, b.bill_date, b.amount, b.status, b.paid_date
      FROM credit_bills b
      JOIN credit_customers c ON b.customer_id = c.id
      ORDER BY b.bill_date DESC
    `;
    const result = await db.query(query);
    
    const data = result.rows.map(row => ({
        'ID': row.id,
        'Customer': row.customer,
        'Bill No': row.bill_no,
        'Bill Date': formatDate(row.bill_date),
        'Amount': Number(row.amount),
        'Status': row.status,
        'Paid Date': formatDate(row.paid_date)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Credit Bills');
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, 
        { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const getUtilityBillsExcel = async () => {
    const query = `
      SELECT id, branch_name, bill_type, bill_no, amount, due_date, status, paid_date
      FROM utility_bills
      ORDER BY due_date DESC
    `;
    const result = await db.query(query);
    
    const data = result.rows.map(row => ({
        'ID': row.id,
        'Branch': row.branch_name,
        'Type': row.bill_type,
        'Bill No': row.bill_no,
        'Amount': Number(row.amount),
        'Due Date': formatDate(row.due_date),
        'Status': row.status,
        'Paid Date': formatDate(row.paid_date)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Utility Bills');
    
    worksheet['!cols'] = [
        { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, 
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const getExpendituresExcel = async () => {
    const query = `
      SELECT e.id, s.name as section, c.name as category, e.amount, e.expense_date, e.description
      FROM expenditures e
      JOIN expenditure_sections s ON e.section_id = s.id
      JOIN expenditure_categories c ON e.category_id = c.id
      ORDER BY e.expense_date DESC
    `;
    const result = await db.query(query);
    
    const data = result.rows.map(row => ({
        'ID': row.id,
        'Section': row.section,
        'Category': row.category,
        'Amount': Number(row.amount),
        'Date': formatDate(row.expense_date),
        'Description': row.description || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenditures');
    
    worksheet['!cols'] = [
        { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, 
        { wch: 12 }, { wch: 40 }
    ];
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const getSupplierInvoicesExcel = async () => {
    const query = `
      SELECT id, supplier_name, grn_no, invoice_no, invoice_date, amount, due_date, status, paid_date
      FROM supplier_invoices
      ORDER BY invoice_date DESC
    `;
    const result = await db.query(query);
    
    const data = result.rows.map(row => ({
        'ID': row.id,
        'Supplier': row.supplier_name,
        'GRN No': row.grn_no,
        'Invoice No': row.invoice_no,
        'Invoice Date': formatDate(row.invoice_date),
        'Amount': Number(row.amount),
        'Due Date': formatDate(row.due_date),
        'Status': row.status,
        'Paid Date': formatDate(row.paid_date)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Supplier Invoices');
    
    worksheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
    getCreditBillsExcel,
    getUtilityBillsExcel,
    getExpendituresExcel,
    getSupplierInvoicesExcel
};
