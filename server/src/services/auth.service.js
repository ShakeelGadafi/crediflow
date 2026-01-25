const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (email, password) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.is_active) {
    throw new Error('Account is inactive');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Return user info sans password
  const { password_hash, ...userInfo } = user;

  return { token, user: userInfo };
};

const getUserById = async (id) => {
  const result = await db.query(
    'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

module.exports = {
  login,
  getUserById,
};
