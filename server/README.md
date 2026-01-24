# CrediFlow Server - Phase 1

This is the backend implementation for Phase 1 of the CrediFlow application.

## Features Implemented
1.  **PostgreSQL Connection**: Configured using `pg` and environment variables.
2.  **Authentication**: JWT-based login system.
3.  **Role System**: Supports `ADMIN` and `STAFF` roles.
4.  **Admin Enforcement**: Only one active `ADMIN` account allowed (data enforced).
5.  **Permissions**: Granular module permissions for Staff (`view`, `create`, `update`, `delete`).
6.  **Middleware**:
    *   `requireAuth`: Validates JWT and retrieves user.
    *   `requireAdmin`: Ensures the user has the `ADMIN` role.
    *   `requirePermission`: Checks DB-based permissions for specific modules.

## Prerequisites
*   Node.js (v14+)
*   PostgreSQL

## Installation
1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` folder (or use existing):
    ```env
    DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/crediflow
    JWT_SECRET=super_secret_key_change_me
    JWT_EXPIRES_IN=7d
    PORT=5000
    ```

## Database Setup
Ensure your PostgreSQL database `crediflow` is running and the tables (`users`, `modules`, `user_module_permissions`) are created.

### Create First Admin
You must manually seed the first Admin user. Run this SQL query in your database:

```sql
-- Password is 'admin123'
INSERT INTO users (full_name, email, password_hash, role, is_active)
VALUES (
    'Super Admin', 
    'admin@crediflow.com', 
    '$2b$10$Dx5ncctMaQvGdjygt.aHhug/eYAthrXF0BkNk1pG03uA6hFBkKDXS', 
    'ADMIN', 
    true
);
```

## detailed Usage

### Start Server
```bash
npm run dev
# OR
npm start
```

### Authentication Endpoints

#### POST /api/auth/login
Login to get a JWT token.
*   **Body**:
    ```json
    {
      "email": "admin@crediflow.com",
      "password": "admin123"
    }
    ```
*   **Response**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1...",
      "user": { ... }
    }
    ```

#### GET /api/auth/me
Get current user details.
*   **Headers**: `Authorization: Bearer <token>`

### Admin Endpoints (Requires ADMIN Token)

#### POST /api/admin/staff
Create a new Staff user.
*   **Body**:
    ```json
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "password": "password123"
    }
    ```

#### GET /api/admin/staff
List all Staff users.

#### PATCH /api/admin/staff/:id
Activate or Deactivate a staff member.
*   **Body**:
    ```json
    {
      "is_active": false
    }
    ```

#### GET /api/admin/modules
List all available modules.

#### PUT /api/admin/staff/:id/permissions
Update permissions for a staff member.
*   **Body**:
    ```json
    {
      "permissions": [
        {
          "moduleId": 1, 
          "can_view": true,
          "can_create": false,
          "can_update": false,
          "can_delete": false
        }
      ]
    }
    ```

## Developer Notes

### Using Permission Middleware
To protect a route with specific module permissions, use the `requirePermission` middleware:

```javascript
const { requirePermission } = require('../middleware/permission.middleware');

// Example: Only staff with 'view' permission on 'CREDIT_TO_COME' module can access
router.get(
  '/credit-records',
  requireAuth,
  requirePermission('CREDIT_TO_COME', 'view'),
  creditController.listRecords
);
```

Supported actions: `view`, `create`, `update`, `delete`.
