const expenditureService = require('../services/expenditure.service');

const getSections = async (req, res) => {
  try {
    const sections = await expenditureService.getSections();
    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const section = await expenditureService.createSection(name);
    res.status(201).json(section);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') return res.status(409).json({ message: 'Section already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const categories = await expenditureService.getCategories(sectionId);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const category = await expenditureService.createCategory(sectionId, name);
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') return res.status(409).json({ message: 'Category already exists in this section' });
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getExpenditures = async (req, res) => {
  try {
    const { from, to, sectionId, categoryId } = req.query;
    const result = await expenditureService.getExpenditures({ from, to, sectionId, categoryId });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createExpenditure = async (req, res) => {
  try {
    const { section_id, category_id, amount, expense_date, description } = req.body;
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!section_id || !category_id || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newExpenditure = await expenditureService.createExpenditure({
      section_id,
      category_id,
      amount,
      expense_date,
      description,
      attachment_url
    });
    res.status(201).json(newExpenditure);
  } catch (error) {
    console.error(error);
    if (error.message === 'Category does not belong to the specified section') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const summary = await expenditureService.getSummary(from, to);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSections,
  createSection,
  getCategories,
  createCategory,
  getExpenditures,
  createExpenditure,
  getSummary
};
