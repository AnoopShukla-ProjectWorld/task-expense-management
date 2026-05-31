# Task & Expense Management Hub

An internal corporate management portal designed to streamline project tracking, task delegation, and business expense auditing. Built on a React and Node.js/Express architecture, the platform features a relational database integration and **Synapse AI**, a utility that queries live database tables to provide operational context for administrative queries.

---

## 🎯 Project Overview & Business Workflow

The system coordinates workflows across three distinct user roles: **Administrators, Project Managers, and Employees**.

```
[Employee] ———> Files Expense claims & Updates assigned Tasks
   |
   v
[Manager] ———> Allocates Tasks, Reviews Expenses, & Tracks Project Budgets
   |
   v
[Admin]   ———> Audits System-Wide Activities, Manages Users, & Queries Synapse AI
```

1. **User Onboarding**: Public registration requests enter a pending state. Administrators approve, reject, or suspend accounts through a dedicated management panel.
2. **Project & Task Allocation**: Managers establish projects, define budgets, and delegate tasks to team members. Employees update task progress percentages and completion states.
3. **Expense Auditing Flow**: Employees submit operational expense claims classified by category, uploading receipt attachments (images or PDFs). Managers or Administrators review, approve, or reject these claims, dynamically updating the project’s utilized budget.
4. **Operations Intelligence (Synapse AI)**: Administrators can query an integrated AI assistant. The assistant retrieves real-time relational tables from the database and answers questions about workforce workloads, budget utilization, and upcoming deadlines.
5. **System Accountability**: Every administrative and state-changing action (logins, user approvals, expense reviews, project edits) is recorded in a chronological audit log.

---

## 👥 User Roles & Clearances

* **Administrator**: Full access to user profiles, status transitions (Approved, Pending, Suspended, Rejected), system audit trails, reporting metrics, and conversational database queries via Synapse AI.
* **Project Manager**: Manages assigned projects, delegates tasks, monitors budget utilization (spent vs. allocated), and reviews expense claims filed under their projects.
* **Employee**: Accesses assigned tasks, updates task progress (status, completion percentage), files expense claims with receipt uploads, and reviews personal task metrics.

---

## ⚙️ Features by Module

### 🔐 Authentication & Session Security
* **Multi-Stage Registration**: Secures account enrollment using email/mobile OTP verification and a geometric vector-path CAPTCHA challenge.
* **Administrator Portal Entry**: Administrators log in through a dedicated route protected by a secret passphrase and query rate limiters (`adminAuthLimiter`).
* **Session Protection**: Implements HTTPOnly JWT cookies (`accessToken` and `refreshToken`) to mitigate XSS and CSRF risks.
* **Spam Prevention**: Employs a hidden honeypot field in registration forms to intercept automated bot submissions.

### 📋 Project & Task Management
* **Project Tracking**: Manages project configurations, timelines, priorities, budgets, and manager assignments.
* **Dynamic Progress Calculation**: Calculates project completion rates dynamically based on the average completion percentage of all underlying tasks.
* **Responsive Task Calendar**: Renders an interactive monthly calendar displaying scheduled deadlines. Includes horizontal scroll containers to ensure readability and swipe usability on mobile screens.
* **Document Management**: Supports linking project or task file paths directly inside the workspace.

### 💰 Expense & Budget Auditing
* **Categorized Expense Logging**: Supports logging operational expenses across standard categories (Travel, Food, Office Supplies, Software, Utilities, Miscellaneous).
* **Receipt Attachments**: Handles file uploads (images or PDFs) using custom `multer` middleware, storing files in isolated disk directories on the server.
* **Budget Threshold Visuals**: Renders color-coded warning bars (Green, Amber, Rose) based on the current ratio of approved expenses to the overall project budget.
* **Spreadsheet Exports**: Supports exporting data lists directly to standard CSV files for offline analysis.

### 🚨 Audit & Accountability
* **Chronological Logs**: Logs user ID, performed action, targeted entity (User, Project, Task, Expense), IP address, and timestamp.
* **Keystroke API Protection**: Search fields utilize debounced queries and submit buttons to prevent request storms on backend connection pools.
* **Paging Optimization**: Tables implement client-side pagination showing 15 items per page to reduce DOM lag and database load.
* **System Notifications**: Distributes real-time alerts (e.g. task assignments, expense reviews) inside the global navigation header, configured to prevent viewport overflow on small viewports.

---

## 🏢 System Architecture

```
                       +----------------------------------+
                       |           Web Browser            |
                       |    (React 19 + Vite + Tailwind)  |
                       +----------------+-----------------+
                                        |
                                        | HTTPS Requests
                                        v
                       +----------------+-----------------+
                       |         Express Server           |
                       |         (Node.js v20+)           |
                       +-------+----------------+---------+
                               |                |
             SQL Queries (TCP) |                | HTTPS fetch Stream
                               v                v
                  +------------+----+     +-----+------------+
                  |  MSSQL Database |     |  Google Gemini   |
                  |  (SQL Server)   |     |    REST API      |
                  +-----------------+     +------------------+
```

---

## 🤖 Synapse AI Copilot Architecture

**Synapse AI** functions as an operational intelligence utility using a database **RAG (Retrieval-Augmented Generation)** pattern:

```
[User Message] 
     |
     v
[aiController.js] ——> Queries [aiService.js] ——> Fetches Live Metrics from SQL Server
     |                                           (Users, Budgets, Workloads, Audits)
     v
[Compiles Markdown Database Context] 
     |
     v
[Direct REST Call] ———> https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash
     |
     v
[Stream response back to Client]
```

### Context Injection Workflow:
1. The user sends a query through the UI chat widget.
2. `aiController.js` calls `getDatabaseContextSummary()` inside `aiService.js`.
3. The service queries live connection pools to pull current database statistics:
   * Registered users, roles, statuses, and departments.
   * Project metadata, assigned managers, allocated budgets, and utilized spent values.
   * Assigned tasks, progress percentages, and deadlines.
   * Recent chronological system audit activities.
4. The service compiles these metrics into structured Markdown tables and injects them directly as context into the `systemInstruction` prompt block.
5. The backend dispatches a direct HTTPS `fetch` request to the Google Gemini API (`gemini-2.5-flash` model), bypassing older SDK prefix requirements to support both standard and new `AQ.` fast-revoking keys.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS, TanStack React Query, Framer Motion, Recharts.
* **Backend**: Node.js, Express.js, JWT Cookie Parser, Multer, SVG-CAPTCHA.
* **Database**: Microsoft SQL Server (MSSQL) with customized connection pooling configuration.
* **API Integration**: Direct Google Gemini REST Endpoints (`gemini-2.5-flash`).

---

## 💾 Database Architecture

The SQL Server database is structured using normalized relational tables and optimized with standard indices to support fast nested joins.

### Key Database Tables:
* `users`: Stores user credentials, email verification flags, lock timers, department IDs, role mappings (`admin`, `manager`, `employee`, `pending`), and status configurations (`pending`, `approved`, `rejected`, `suspended`).
* `projects`: Tracks project timelines, priorities, budgets, manual completion ratios, document directories, and manager assignments.
* `tasks`: Stores operational task details, deadlines, completion percentages, assigned employees, and project foreign keys.
* `expenses`: Stores financial claims (amount, category, claimant user_id, associated project_id, status ['PENDING', 'APPROVED', 'REJECTED'], manager approval status, and task_id).
* `expense_attachments`: Links uploaded receipts, file sizes, local storage paths, and mime types.
* `audit_logs`: Chronological log entries capturing user ID, performed action, targeted entity name/ID, IP address, and timestamp.
* `otp_verifications`: Tracks verification hashes, resend counters, and expiration boundaries.

---

## 📂 Folder Structure

```
task-expense-management/
├── client/                     # React Frontend Workspace
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/         # Reusable UI, Modals, & Navbar
│   │   ├── config/             # Third-party configurations
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── layouts/            # Dashboard layouts
│   │   ├── pages/              # Portal pages grouped by user role
│   │   ├── routes/             # AppRoutes & Route guards
│   │   └── services/           # Api service wrappers (projects, tasks, expenses)
│   └── index.html
├── server/                     # Express Backend Workspace
│   ├── src/
│   │   ├── config/             # DB Connection pooling, rate limiters, cookies
│   │   ├── controllers/        # Express API request controllers
│   │   ├── database/           # Seed scripts (seed.js)
│   │   ├── middlewares/        # JWT auth, role validation, file upload config
│   │   ├── repositories/       # Parameterized SQL Server queries
│   │   ├── routes/             # API routing endpoints
│   │   ├── services/           # Service calculations (aiService)
│   │   └── utils/              # CAPTCHA generation, mailers, response wrappers
│   └── package.json
└── database/
    └── migration.sql           # Database schema & migration script
```

---

## 🔌 API Overview

### Authentication & Sessions
* `GET /api/v1/auth/captcha` — Generates anti-bot CAPTCHA drawing.
* `POST /api/v1/auth/register` — Submits a registration request.
* `POST /api/v1/auth/login` — Authenticates credentials & sets secure cookies.
* `POST /api/v1/auth/secure-admin-login` — Rate-limited administrator clearance.
* `POST /api/v1/auth/logout` — Clears active session tokens and cookies.

### Projects & Task Allocations
* `GET /api/v1/projects` — Lists active projects.
* `POST /api/v1/projects` — Creates a new project (Admin clearance).
* `GET /api/v1/tasks` — Fetches operational tasks.
* `POST /api/v1/tasks` — Delegates a task to an employee (Manager clearance).

### Expenses & Financial Claims
* `GET /api/v1/expenses` — Retrieves filtered expense claims.
* `POST /api/v1/expenses` — Files a new claim with receipt attachment (Multer upload).
* `PATCH /api/v1/expenses/:id/review` — Approves or rejects claims (Manager/Admin clearance).

### Synapse AI Copilot
* `POST /api/v1/ai/chat` — Securely streams context-injected database RAG prompt to Gemini.

---

## 🔧 Installation & Setup

### 1. Database Setup
1. Log in to your Microsoft SQL Server instance.
2. Create a new database named `task_expense_db`.
3. Execute the `/database/migration.sql` script to initialize the relational schema, tables, triggers, and indices.
4. Populate database tracking tables with seed records by running this command inside the `/server` directory:
   ```bash
   npm run seed
   ```

### 2. Backend Server Configuration
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server/` directory and populate the required keys:
   ```env
   PORT=5000
   DB_USER=your_sql_server_username
   DB_PASSWORD=your_sql_server_password
   DB_SERVER=your_sql_server_host_address
   DB_DATABASE=task_expense_db
   DB_PORT=1433
   JWT_SECRET=your_secure_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Boot the Express API server:
   ```bash
   npm start
   ```

### 3. Frontend Client Configuration
1. Open a new terminal window and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the local development server:
   ```bash
   npm run dev
   ```
4. The client will be active at `http://localhost:5173`.

---

## 📊 Environment Variables Checklist

Ensure the following variables are configured locally in your environment files (note that `.env` files are ignored from Git tracking for security):

| Variable Name | Description | Required In |
|---|---|---|
| `PORT` | Host port mapped to the backend server. | Backend `.env` |
| `DB_USER` | Microsoft SQL Server system login username. | Backend `.env` |
| `DB_PASSWORD` | Microsoft SQL Server system login password. | Backend `.env` |
| `DB_SERVER` | Target database server address (e.g. `localhost`). | Backend `.env` |
| `DB_DATABASE` | Target database name (`task_expense_db`). | Backend `.env` |
| `JWT_SECRET` | Signing key used to verify HTTPOnly session cookies. | Backend `.env` |
| `GEMINI_API_KEY` | Google API key used to query the Gemini model. | Backend `.env` |

---

## 🔮 Future Enhancements

* Additional features can be added in the future as per business requirements.
