# CrediFlow Client

This is the frontend for the CrediFlow application, built with React (Vite), Tailwind CSS, and Context API.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd client
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the `client` directory:
    ```
    VITE_API_URL=http://localhost:5000
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Authentication Flow

1.  **Login**: User enters credentials at `/login`. `apiClient` sends POST to backend.
2.  **Token Storage**: JWT token is stored in `localStorage`.
3.  **Context**: `AuthProvider` (in `src/auth/AuthContext.jsx`) loads the user profile using the token (`fetchMe`).
4.  **Protection**: `ProtectedRoute` component checks if user is loaded. If not, redirects to `/login`.
5.  **Interceptors**: `src/api/apiClient.js` attaches `Authorization: Bearer <token>` to every request.

## Permission-Based Sidebar

The sidebar (`src/layout/Sidebar.jsx`) dynamically filters menu items based on the logged-in user's permissions or role.

- **Keys**:
    - `CREDIT_TO_COME`
    - `DAILY_EXPENDITURE_UTILITIES`
    - `DAILY_EXPENDITURE_TRACKER`
    - `GRN_CREDIT_REMINDER`

These keys are checked against `user.permissions`. Admins typically have access to all.

## Folder Structure

- `src/api`: Axios client setup.
- `src/auth`: Authentication context and hooks.
- `src/components`: Reusable UI components (ProtectedRoute, etc.).
- `src/layout`: Layout components (Sidebar, Topbar, MainLayout).
- `src/pages`: Page components organized by feature module.

## Feature Modules

### Expenditure Tracker (DAILY_EXPENDITURE_TRACKER)

The Expenditure module uses a **Month-First** redesign:

*   **Month View** (`/expenditure`): Shows all expenses for a selected month, grouped by **Section**.
    *   Sections are collapsible (accordion style).
    *   Shows totals for the month and per section.
    *   Allows adding new expenditures directly into sections.
    *   Allows creating new sections.
*   **Summary** (`/expenditure/summary`): High-level overview.
    *   Grand total and top sections stats.
    *   Monthly breakdown (expandable rows) to drill down into historical data.
    *   Date range filtering.
*   **All Records** (`/expenditure/all`): Flat list of all historical records.
    *   Filters for Date Range, Section, and Category.
    *   Clean table view with attachment links.
