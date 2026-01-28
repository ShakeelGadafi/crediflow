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

  // Fetch permissions
  const permissions = await getUserPermissions(user.id);

  // Return user info sans password
  const { password_hash, ...userInfo } = user;

  return { token, user: { ...userInfo, permissions } };
};

const getUserById = async (id) => {
  const result = await db.query(
    'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  const user = result.rows[0];
  
  if (user) {
      user.permissions = await getUserPermissions(user.id);
  }
  
  return user;
};

const getUserPermissions = async (userId) => {
    const result = await db.query(`
        SELECT m.key
        FROM user_module_permissions ump
        JOIN modules m ON m.id = ump.module_id
        WHERE ump.user_id = $1 AND ump.can_view = true
    `, [userId]);
    return result.rows.map(row => row.key);
};

module.exports = {
  login,
  getUserById,
};
