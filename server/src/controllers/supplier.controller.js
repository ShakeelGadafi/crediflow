const supplierService = require('../services/supplier.service');

const getInvoices = async (req, res) => {
  try {
    const { supplier_name, status, from, to, search } = req.query;
    const invoices = await supplierService.getInvoices({ supplier_name, status, from, to, search });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { 
      supplier_name, grn_no, invoice_no, invoice_date, 
      amount, credit_days, notes 
    } = req.body || {};
    
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!supplier_name || !invoice_no || !amount || !invoice_date || credit_days === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newInvoice = await supplierService.createInvoice({
      supplier_name,
      grn_no,
      invoice_no,
      invoice_date,
      amount,
      credit_days,
      notes,
      attachment_url
    });
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDueSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const invoices = await supplierService.getInvoicesDueSoon(days);
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOverdue = async (req, res) => {
  try {
    const invoices = await supplierService.getOverdueInvoices();
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await supplierService.markPaid(id);
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await supplierService.getInvoiceById(id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const updatedInvoice = await supplierService.updateStatus(id, status);
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, notes } = req.body;
    const updatedInvoice = await supplierService.updateInvoice(id, { 
      supplier_name, grn_no, invoice_no, invoice_date, amount, credit_days, notes 
    });
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await supplierService.deleteInvoice(id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully', invoice: deletedInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getDueSoon,
  getOverdue,
  markPaid,
  updateStatus,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
