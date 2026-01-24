const utilityService = require('../services/utility.service');

const getBills = async (req, res) => {
  try {
    const { branch_name, status } = req.query;
    const bills = await utilityService.getBills({ branch_name, status });
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createBill = async (req, res) => {
  try {
    const { branch_name, bill_type, bill_no, amount, due_date, notes } = req.body || {};
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!branch_name || !bill_type || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newBill = await utilityService.createBill({
      branch_name,
      bill_type,
      bill_no,
      amount,
      due_date,
      notes,
      attachment_url,
    });
    res.status(201).json(newBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await utilityService.getBillById(id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const markBillPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBill = await utilityService.markBillPaid(id);
    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(updatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const generateIcs = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await utilityService.getBillById(id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (!bill.due_date) {
        return res.status(400).json({ message: 'This bill has no due date' });
    }

    // Format date for ICS: YYYYMMDD
    const dueDate = new Date(bill.due_date);
    const dateString = dueDate.toISOString().replace(/-/g, '').substring(0, 8);
    const nowString = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const summary = `${bill.bill_type} Due - ${bill.branch_name}`;
    const description = `Bill No: ${bill.bill_no || 'N/A'}\\nAmount: ${bill.amount}\\nNotes: ${bill.notes || ''}`;

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CrediFlow//Utility Tracker//EN
BEGIN:VEVENT
UID:${bill.id}@crediflow.com
DTSTAMP:${nowString}
DTSTART;VALUE=DATE:${dateString}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename=utility-bill-${bill.id}.ics`);
    res.send(icsContent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getBills,
  createBill,
  getBillById,
  markBillPaid,
  generateIcs,
};
