const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const data = await authService.login(email, password);
    res.json(data);
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
      return res.status(401).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  getMe,
};
