const db = require('../config/db');
const bcrypt = require('bcrypt');

const createStaff = async (data) => {
  const { full_name, email, password } = data;
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'STAFF', true)
     RETURNING id, full_name, email, role, is_active`,
    [full_name, email, passwordHash]
  );
  
  return result.rows[0];
};

const getAllStaff = async () => {
  const result = await db.query(
    "SELECT id, full_name, email, role, is_active, created_at FROM users WHERE role = 'STAFF' ORDER BY created_at DESC"
  );
  return result.rows;
};

const toggleStaffStatus = async (id, isActive) => {
  const result = await db.query(
    'UPDATE users SET is_active = $1 WHERE id = $2 AND role = \'STAFF\' RETURNING id, is_active',
    [isActive, id]
  );
  return result.rows[0];
};

const getModules = async () => {
  const result = await db.query('SELECT * FROM modules ORDER BY name');
  return result.rows;
};

const upsertPermission = async (userId, moduleId, permissions) => {
  const { can_view, can_create, can_update, can_delete } = permissions;
  
  // Check if permission exists
  const check = await db.query(
    'SELECT id FROM user_module_permissions WHERE user_id = $1 AND module_id = $2',
    [userId, moduleId]
  );

  if (check.rows.length > 0) {
    // Update
    const result = await db.query(
      `UPDATE user_module_permissions 
       SET can_view = $3, can_create = $4, can_update = $5, can_delete = $6, updated_at = NOW()
       WHERE user_id = $1 AND module_id = $2
       RETURNING *`,
      [userId, moduleId, can_view, can_create, can_update, can_delete]
    );
    return result.rows[0];
  } else {
    // Insert
    const result = await db.query(
      `INSERT INTO user_module_permissions (user_id, module_id, can_view, can_create, can_update, can_delete)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, moduleId, can_view, can_create, can_update, can_delete]
    );
    return result.rows[0];
  }
};

const updateStaffPermissions = async (userId, permissionsArray) => {
    // permissionsArray: [{ moduleId, can_view, ... }]
    const results = [];
    for (const p of permissionsArray) {
        const res = await upsertPermission(userId, p.moduleId, p);
        results.push(res);
    }
    return results;
};

const getStaffPermissions = async (userId) => {
    const query = `
        SELECT m.id as module_id, m.key, m.name, 
               ump.can_view, ump.can_create, ump.can_update, ump.can_delete
        FROM modules m
        LEFT JOIN user_module_permissions ump ON ump.module_id = m.id AND ump.user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
};

module.exports = {
  createStaff,
  getAllStaff,
  toggleStaffStatus,
  getModules,
  updateStaffPermissions,
  getStaffPermissions
};
