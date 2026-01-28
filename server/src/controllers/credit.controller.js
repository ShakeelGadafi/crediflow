const creditService = require('../services/credit.service');

const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const customers = await creditService.getCustomers(search);
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { full_name, phone, address, notes } = req.body;
    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    const newCustomer = await creditService.createCustomer({ full_name, phone, address, notes });
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await creditService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getBills = async (req, res) => {
  try {
    const { id } = req.params;
    const bills = await creditService.getBillsByCustomerId(id);
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createBill = async (req, res) => {
  try {
    const { id } = req.params;
    let { bill_no, bill_date, amount } = req.body || {};
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    if (!bill_date) {
      bill_date = new Date();
    }

    const newBill = await creditService.createBill({
      customer_id: id,
      bill_no,
      bill_date,
      amount,
      attachment_url,
    });
    res.status(201).json(newBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markBillPaid = async (req, res) => {
  try {
    const { billId } = req.params;
    const updatedBill = await creditService.markBillPaid(billId);
    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(updatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markBillUnpaid = async (req, res) => {
  try {
    const { billId } = req.params;
    const updatedBill = await creditService.markBillUnpaid(billId);
    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(updatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  getCustomerById,
  getBills,
  createBill,
  markBillPaid,
  markBillUnpaid,
};
