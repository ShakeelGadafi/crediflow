const exportService = require('../services/export.service');

const exportCreditBills = async (req, res) => {
    try {
        const buffer = await exportService.getCreditBillsExcel();
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('credit-bills.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportUtilityBills = async (req, res) => {
    try {
        const buffer = await exportService.getUtilityBillsExcel();
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('utility-bills.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportExpenditures = async (req, res) => {
    try {
        const buffer = await exportService.getExpendituresExcel();
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('expenditures.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const exportSupplierInvoices = async (req, res) => {
    try {
        const buffer = await exportService.getSupplierInvoicesExcel();
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('supplier-invoices.xlsx');
        res.send(buffer);
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
