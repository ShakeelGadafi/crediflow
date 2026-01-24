const db = require('../config/db');

const requirePermission = (moduleKey, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Admins usually have full access, but specific requirement says "Only ONE active ADMIN". 
      // If the prompt implies ROLE checking is distinct from Permissions, we should strictly follow.
      // Usually Admins bypass permissions, but let's check if the requirement implies otherwise.
      // "Module permissions per staff". It implies Admin has implicit or separate access.
      // I will assume Admin has full access to everything for simplicity and standard patterns,
      // unless specifically restricted.
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Map action to column
      // Actions: 'view', 'create', 'update', 'delete'
      const actionToColumn = {
        view: 'can_view',
        create: 'can_create',
        update: 'can_update',
        delete: 'can_delete',
      };

      const column = actionToColumn[action];
      if (!column) {
        return res.status(500).json({ message: 'Invalid permission action' });
      }

      const query = `
        SELECT ump.${column}
        FROM user_module_permissions ump
        JOIN modules m ON ump.module_id = m.id
        WHERE ump.user_id = $1 AND m.key = $2
      `;

      const result = await db.query(query, [req.user.id, moduleKey]);

      if (result.rows.length === 0 || !result.rows[0][column]) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = {
  requirePermission,
};
