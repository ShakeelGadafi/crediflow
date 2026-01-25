# CrediFlow Server - Phases 1 to 6 (Complete)

This is the backend implementation for the complete CrediFlow application (Phases 1-6).

## Features Implemented

### Phase 1: Core & Auth
1.  **PostgreSQL Connection**: Configured using `pg` and environment variables.
2.  **Authentication**: JWT-based login system.
3.  **Role System**: Supports `ADMIN` and `STAFF` roles.
4.  **Admin Enforcement**: Only one active `ADMIN` account allowed (data enforced).
5.  **Permissions**: Granular module permissions for Staff (`view`, `create`, `update`, `delete`).
6.  **Middleware**: `requireAuth`, `requireAdmin`, `requirePermission`.

### Phase 2: Credit to Come Module
1.  **Customer Management**: Create and list customers.
2.  **Bill Tracking**: Add bills to customers, mark them as paid.
3.  **Financials**: Automatically calculates total unpaid/paid amounts per customer.
4.  **File Uploads**: Supports attaching files to bills.
5.  **Permissions**: `CREDIT_TO_COME`.

### Phase 3: Utility Bills Tracker
1.  **Utility Tracking**: Track utility bills.
2.  **Filters**: Branch name, status.
3.  **Calendar Integration**: Generate `.ics` files.
4.  **File Uploads**: Attach physical bill images/PDFs.
5.  **Permissions**: `DAILY_EXPENDITURE_UTILITIES`.

### Phase 4: Expenditure Tracker
1.  **Categorization**: Sections & Categories.
2.  **Tracking**: Log daily expenses.
3.  **Filtering & Reporting**: Summary stats by section/category.
4.  **Permissions**: `DAILY_EXPENDITURE_TRACKER`.

### Phase 5: GRN Credit Reminder
1.  **Invoice Tracking**: Supplier Invoices (GRN based).
2.  **Credit Calculation**: Auto-computes `due_date`.
3.  **Alerts**: Due-soon and Overdue lists.
4.  **Permissions**: `GRN_CREDIT_REMINDER`.

### Phase 6: Dashboard, Export & Final Polish
1.  **Dashboard API**: Aggregated statistics for all modules.
    *   Credit: Total outstanding, total collected.
    *   Utilities: Due in 7 days.
    *   Expenditure: Top 5 sections.
    *   Suppliers: Overdue invoices count/amount.
2.  **CSV Export**: Download full datasets as `.csv` files.
3.  **Endpoints**: `/api/dashboard/*`, `/api/export/*`.

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

### Credit Module Endpoints (Requires `CREDIT_TO_COME` permissions)

#### GET /api/credit/customers
List all customers with their total unpaid amount.

#### POST /api/credit/customers
Create a new credit customer.
*   **Body**:
    ```json
    {
      "full_name": "ABC Corp",
      "phone": "1234567890",
      "address": "123 Main St",
      "notes": "VIP Client"
    }
    ```

#### GET /api/credit/customers/:id
Get customer details plus `total_paid` and `total_unpaid`.

#### GET /api/credit/customers/:id/bills
List all bills for a specific customer.

#### POST /api/credit/customers/:id/bills
Create a new bill. Supports `multipart/form-data`.
*   **Body (Checkout params)**:
    *   `bill_no`: "INV-001"
    *   `bill_date`: "2023-10-27"
    *   `amount`: 150.00
    *   `attachment`: (File)

#### PATCH /api/credit/bills/:billId/mark-paid
Mark a specific bill as PAID.

### Utility Module Endpoints (Requires `DAILY_EXPENDITURE_UTILITIES` permissions)

#### GET /api/utilities
List utility bills.
*   **Query Params**: `branch_name`, `status` (UNPAID/PAID)

#### POST /api/utilities
Create a new utility bill. Supports `multipart/form-data`.
*   **Body**:
    *   `branch_name`: "New York HQ"
    *   `bill_type`: "Electricity"
    *   `bill_no`: "ELEC-2023-001"
    *   `amount`: 500.00
    *   `due_date`: "2023-11-01"
    *   `notes`: "October bill"
    *   `attachment`: (File)

#### GET /api/utilities/:id
Get bill details.

#### PATCH /api/utilities/:id/mark-paid
Mark a utility bill as PAID.

#### GET /api/utilities/:id/calendar.ics
Download an iCalendar (.ics) file for the bill's due date.

### Expenditure Endpoints (Requires `DAILY_EXPENDITURE_TRACKER` permissions)

#### GET /api/expenditure/sections
List all expenditure sections.

#### POST /api/expenditure/sections
Create a section.
*   **Body**: `{"name": "Operations"}`

#### GET /api/expenditure/sections/:sectionId/categories
List categories for a section.

#### POST /api/expenditure/sections/:sectionId/categories
Create a category.
*   **Body**: `{"name": "Transport"}`

#### POST /api/expenditure
Create an expenditure.
*   **Body**:
    *   `section_id`: 1
    *   `category_id`: 2
    *   `amount`: 50.00
    *   `expense_date`: "2024-03-01"
    *   `description`: "Taxi fare"
    *   `attachment`: (File)

#### GET /api/expenditure
List expenditures.
*   **Query Params**: `from`, `to`, `sectionId`, `categoryId`

#### GET /api/expenditure/summary
Get summary report.
*   **Query Params**: `from`, `to` (e.g., `?from=2024-03-01&to=2024-03-31`)
*   **Response**:
    ```json
    {
      "grand_total": 5000,
      "totals_by_section": [...],
      "totals_by_category": [...]
    }
    ```

### Supplier Invoice Endpoints (Requires `GRN_CREDIT_REMINDER` permissions)

#### POST /api/suppliers/invoices
Create a supplier invoice.
*   **Body (form-data)**:
    *   `supplier_name`: "ABC Supplies"
    *   `grn_no`: "GRN-2024-001"
    *   `invoice_no`: "INV-999"
    *   `invoice_date`: "2024-03-01"
    *   `amount`: 5000.00
    *   `credit_days`: 30
    *   `attachment`: (File)
    *   *Note: `due_date` is auto-calculated as 2024-03-31*

#### GET /api/suppliers/invoices
List invoices.
*   **Query Params**: `supplier_name`, `status` (UNPAID/PAID), `from`, `to` (invoice_date)

#### GET /api/suppliers/invoices/due-soon
List invoices due within X days.
*   **Query Params**: `days` (default 7)

#### GET /api/suppliers/invoices/overdue
List overdue UNPAID invoices.

#### PATCH /api/suppliers/invoices/:id/mark-paid
Mark invoice as PAID.

### Dashboard Endpoints
*   `GET /api/dashboard/credit` (Perm: CREDIT_TO_COME -> view)
*   `GET /api/dashboard/utilities?days=7` (Perm: DAILY_EXPENDITURE_UTILITIES -> view)
*   `GET /api/dashboard/expenditure?from=...&to=...` (Perm: DAILY_EXPENDITURE_TRACKER -> view)
*   `GET /api/dashboard/suppliers?days=7` (Perm: GRN_CREDIT_REMINDER -> view)

### Export Endpoints
These endpoints trigger a file download (CSV).
*   `GET /api/export/credit-bills.csv`
*   `GET /api/export/utility-bills.csv`
*   `GET /api/export/expenditures.csv`
*   `GET /api/export/supplier-invoices.csv`

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
