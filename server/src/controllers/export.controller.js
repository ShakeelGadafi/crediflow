const exportService = require('../services/export.service');

const exportCreditBills = async (req, res) => {
    try {
        const csv = await exportService.getCreditBillsCSV();
        res.header('Content-Type', 'text/csv');
        res.attachment('credit-bills.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportUtilityBills = async (req, res) => {
    try {
        const csv = await exportService.getUtilityBillsCSV();
        res.header('Content-Type', 'text/csv');
        res.attachment('utility-bills.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportExpenditures = async (req, res) => {
    try {
        const csv = await exportService.getExpendituresCSV();
        res.header('Content-Type', 'text/csv');
        res.attachment('expenditures.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportSupplierInvoices = async (req, res) => {
    try {
        const csv = await exportService.getSupplierInvoicesCSV();
        res.header('Content-Type', 'text/csv');
        res.attachment('supplier-invoices.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    exportCreditBills,
    exportUtilityBills,
    exportExpenditures,
    exportSupplierInvoices
};
