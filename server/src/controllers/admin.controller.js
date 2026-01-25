const adminService = require('../services/admin.service');

const createStaff = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newStaff = await adminService.createStaff({ full_name, email, password });
    res.status(201).json(newStaff);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // Unique violation for email
        return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await adminService.getAllStaff();
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const activateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; // Expecting { is_active: boolean }
    
    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ message: 'is_active must be a boolean' });
    }

    const updatedStaff = await adminService.toggleStaffStatus(id, is_active);
    if (!updatedStaff) {
        return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(updatedStaff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getModules = async (req, res) => {
  try {
    const modules = await adminService.getModules();
    res.json(modules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStaffPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body; // Array of { moduleId, can_view, ... }

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ message: 'Permissions must be an array' });
        }

        const result = await adminService.updateStaffPermissions(id, permissions);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
  createStaff,
  getAllStaff,
  activateStaff,
  getModules,
  updateStaffPermissions
};
