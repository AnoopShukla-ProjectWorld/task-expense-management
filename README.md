# Task & Expense Management Hub

A secure corporate workspace portal designed to streamline project tracking, task delegation, and business expense auditing. Built with a robust React/Express architecture, the platform features a dynamic relational database cockpit and **Synapse AI**, a custom retrieval-augmented generation (RAG) assistant that queries live database pools to provide real-time operational insights.

---

## 🎯 Project Overview & Business Workflow

The platform aligns organizational layers—**Administrators, Project Managers, and Employees**—into a unified workflow:

```
[Employee] ———> Files Expense claims & Updates assigned Tasks
   |
   v
[Manager] ———> Allocates Tasks, Approves/Rejects Expenses, & Tracks Project Budgets
   |
   v
[Admin]   ———> Audits System-Wide Activities, Manages Users, & Queries Synapse AI
```

1. **User Provisioning & Onboarding**: Public registration requests enter a secure pending state. Administrators approve or reject accounts via a dedicated control panel.
2. **Project & Task Lifecycle**: Managers create projects, establish budgets, and delegate tasks. Employees update task completion percentages dynamically.
3. **Expense Auditing Flow**: Employees submit operational expense claims with standard categories and receipt attachments (PDF/Images). Managers or Administrators review and approve/reject claims, updating project budget utilization in real time.
4. **Operations Intelligence (Synapse AI)**: Administrators interact with an integrated conversational AI widget that extracts live relational context from the SQL Server database to answer natural language questions about workforce utilization, budget burns, and overdue deadlines.
5. **System Accountability**: Every security-sensitive activity (logins, user creations, expense reviews, project modifications) is logged to a chronological system audit trail, providing a transparent operational ledger.

---

## 👥 User Roles & Clearances

* **Administrator**: Full master control over user statuses (Approved, Pending, Suspended), system-wide configurations, audit log inspections, reporting tools, and conversational access to Synapse AI.
* **Project Manager**: Manages assigned projects, creates and delegates tasks, monitors budget utilization (spent vs. allocated), and reviews/approves expense claims filed under their projects.
* **Employee**: Accesses their assigned tasks, updates task progress (status, percentage complete), files expense claims with receipt uploads, and tracks their own compensation logs.

---

## ⚡ Features by Module

### 🛡️ Authentication & System Security
* **Multi-Stage Registration**: Collects credentials and secures account creation with email/mobile OTP verification and anti-bot geometric vector-path CAPTCHA drawing.
* **Secure Admin Access**: Administrators log in via a dedicated endpoint protected by a secret passphrase and strict request rate limiters (`adminAuthLimiter`).
* **Session Integrity**: Utilizes secure HTTPOnly JWT cookies (`accessToken` and `refreshToken`) to guard against XSS and CSRF.
* **Honeypot Spam Filtering**: Silently intercepts and discards automated bot registrations via hidden form inputs.

### 📋 Project & Task Management
* **Project Dashboard**: Tracks project name, start/end dates, priorities (Critical, High, Medium, Low), allocated budgets, and manager assignments.
* **Progress Gauges**: Visual progress tracks showing project completion dynamically calculated as the average completion percentage of all underlying tasks.
* **Responsive Task Calendar**: Features an interactive monthly calendar timeline displaying scheduled due dates. Wrapped in an adaptive horizontal scroll structure to support swipe gestures on mobile viewports.
* **Document Attachments**: Supports linking PDF or image project documents directly to tasks.

### 💰 Expense & Budget Control
* **Filing & Categories**: Allows claimants to log expenses across standard categories (Travel, Food, Office Supplies, Software, Utilities, Miscellaneous).
* **Multi-Format Receipt Attachments**: Direct file uploads managed via custom `multer` middleware, storing attachments securely on server disk directories.
* **Real-Time Budget Warnings**: Displays color-coded warning tracks (Green for normal, Amber for warning, Rose for critical) as a project’s spent balance approaches or exceeds its allocated budget.
* **Export Utilities**: Supports exporting tables and reports to standard CSV spreadsheets for external reporting.

### 🚨 System Accountability & Audits
* **Chronological Audit Trail**: Captures user ID, performed action, targeted entity (User, Project, Task, Expense), IP address, and timestamp.
* **Keystroke API Protection**: Search fields utilize debounced queries and submit actions to prevent keypress request storms on backend pools.
* **Database Pagination**: Tables implement a 15-item paginated timeline to reduce client DOM node lag and database bandwidth consumption.
* **System Notifications**: Centrally processes and renders contextual alert popups (e.g. "New Task Assigned", "Expense Approved") inside the navbar. Corrected with fixed viewport boundaries to prevent left-side clipping on small viewports.

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

**Synapse AI** operates as a secure, context-aware operations intelligence assistant. Rather than relying on simple static prompt instructions, it implements a dynamic database **RAG (Retrieval-Augmented Generation)** workflow:

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

### Context Injection details:
1. When an admin posts a message, `aiController.js` calls `getDatabaseContextSummary()` inside `aiService.js`.
2. This service queries the live database connection pools to extract:
   * Active registered users and their departments.
   * Active projects, allocated budgets, manager associations, and current approved spent sums.
   * Active tasks, assigned employees, completion percentages, and due dates.
   * Recent chronological system audit trails.
3. The database metrics are formatted into clean Markdown tables and injected directly into the `systemInstruction` configuration.
4. The backend dispatches a direct secure REST request via HTTPS `fetch` to Google's `gemini-2.5-flash` model. 
5. Bypassing older Node SDK key prefix requirements allows the server to authenticate both traditional and new fast-revoking `AQ.` Gemini keys securely.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, TanStack React Query, Framer Motion, Recharts.
* **Backend**: Node.js, Express.js, JWT Cookie Parser, Multer (File Uploads), SVG-CAPTCHA (anti-bot security).
* **Database**: Microsoft SQL Server (MSSQL) with customized connection pooling (`max: 10, min: 0, idleTimeoutMillis: 30000`).
* **API Integration**: Direct Google Gemini REST Endpoint (`gemini-2.5-flash`).

---

## 💾 Database Schema & Architecture

The SQL Server database is structured using normalized relational tables optimized with standard indices.

### Major Database Tables:
* `users`: Stores user metadata (first_name, last_name, email, role ['admin', 'manager', 'employee', 'pending'], status ['pending', 'approved', 'rejected', 'suspended'], mobile_number, email_verified, failed_login_attempts, account_locked_until).
* `projects`: Tracks project configurations, descriptions, manager IDs, priorities, budgets, manual_completion_percentage, and document_path.
* `tasks`: Stores delegated tasks, titles, due dates, completion percentages, assigned employees, and associated project IDs.
* `expenses`: Stores financial claims (amount, category, claimant user_id, associated project_id, status ['PENDING', 'APPROVED', 'REJECTED'], manager_approval status, and task_id).
* `expense_attachments`: Links uploaded receipts, paths, sizes, and mime types.
* `audit_logs`: Chronological audit logs capturing user ID, performed action, targeted entity name/ID, IP address, and timestamp.
* `otp_verifications`: Tracks resend attempts, hashes, and expiration boundaries.

---

## 📂 Folder Structure

```
task-expense-management/
├── client/                     # React Frontend Workspace
│   ├── src/
│   │   ├── api/                # Axios instances & interceptors
│   │   ├── components/         # Shared UI, Modals, & Navbar
│   │   ├── config/             # Third-party credentials (Firebase)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── layouts/            # Dashboard layouts
│   │   ├── pages/              # Portal pages grouped by role (admin, manager, employee)
│   │   ├── routes/             # AppRoutes, ProtectedRoute configurations
│   │   └── services/           # Api service wrappers (projects, tasks, expenses)
│   └── index.html
├── server/                     # Express Backend Workspace
│   ├── src/
│   │   ├── config/             # DB Connection pooling, rate limiters, cookies
│   │   ├── controllers/        # Express API request controllers
│   │   ├── database/           # Seed scripts (seed.js)
│   │   ├── middlewares/        # JWT auth, role validation, file upload config
│   │   ├── repositories/       # SQL Server parameterized query layer
│   │   ├── routes/             # API routing endpoints
│   │   ├── services/           # Service RAG calculations (aiService)
│   │   └── utils/              # CAPTCHA drawings, mailers, response wrappers
│   └── package.json
└── database/
    └── migration.sql           # Complete SQL Server relational schema script
```

---

## 🔌 API Overview

### Authentication & Sessions
* `GET /api/v1/auth/captcha` — Generates anti-bot CAPTCHA drawing.
* `POST /api/v1/auth/register` — Requests public account enrollment.
* `POST /api/v1/auth/login` — Authenticates credentials & sets secure cookies.
* `POST /api/v1/auth/secure-admin-login` — Rate-limited administrator clearance.
* `POST /api/v1/auth/logout` — Destroys active tokens & clears session cookies.

### Projects & Task Allocations
* `GET /api/v1/projects` — Lists active projects.
* `POST /api/v1/projects` — Creates new project (Admin clearance).
* `GET /api/v1/tasks` — Fetches operational tasks.
* `POST /api/v1/tasks` — Delegates task to employee (Manager clearance).

### Expenses & Financial Claims
* `GET /api/v1/expenses` — Retrieves filtered expense claims.
* `POST /api/v1/expenses` — Files new claim with receipt attachment (Multer upload).
* `PATCH /api/v1/expenses/:id/review` — Approves or rejects claims (Manager/Admin clearance).

### Synapse AI Copilot
* `POST /api/v1/ai/chat` — Securely streams context-injected database RAG prompt to Gemini.

---

## 🔧 Installation & Setup

### 1. Database Setup
1. Log in to your Microsoft SQL Server instance.
2. Create a new database named `task_expense_db`.
3. Open and run the complete `/database/migration.sql` script to initialize the relational schema, tables, triggers, and indices.
4. To populate dummy corporate tracking datasets, run the database seed command inside the `/server` directory:
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
3. Boot the local development hot-reload server:
   ```bash
   npm run dev
   ```
4. The client will be active at `http://localhost:5173`.

---

## 📊 Environment Variables Checklist

Ensure the following variables are configured locally in your environment files (note that `.env` files are blocked from Git tracking via `.gitignore` for security):

| Variable Name | Description | Required In |
|---|---|---|
| `PORT` | Local host port mapped to backend server. | Backend `.env` |
| `DB_USER` | Microsoft SQL Server system login username. | Backend `.env` |
| `DB_PASSWORD` | Microsoft SQL Server system login password. | Backend `.env` |
| `DB_SERVER` | Target database server address (e.g. `localhost`). | Backend `.env` |
| `DB_DATABASE` | Target schema database name (`task_expense_db`). | Backend `.env` |
| `JWT_SECRET` | Signing key used to verify HTTPOnly session cookies. | Backend `.env` |
| `GEMINI_API_KEY` | Google API key used to query the Gemini RAG model. | Backend `.env` |

---

## 📸 Screenshots

*Include visual representations of active dashboards here:*

* **Admin Operations Control Panel**  
  ![Admin Cockpit](https://placehold.co/800x450/f8fafc/0f172a?text=Admin+Dashboard+Overview)

* **Manager Project & Budget Tracker Grid**  
  ![Manager Project Cockpit](https://placehold.co/800x450/f8fafc/0f172a?text=Manager+Project+Cards+Grid)

* **Synapse AI RAG Copilot Chat Widget**  
  ![Synapse AI Widget](https://placehold.co/800x450/f8fafc/0f172a?text=Synapse+AI+Chat+Interface)

---

## 🔮 Future Enhancements

Genuine feature upgrades planned for upcoming sprints:
* **Real-time Operations Sync**: Integrate WebSockets (`socket.io`) to stream notifications (e.g. task assignments, expense claims) live to dashboards without requiring manual page reloads.
* **Inline Document Review Panel**: Embed interactive document sliders inside the Expense list and Task detail modals to view, rotate, and zoom uploaded receipt images or PDF files directly within the portal.
* **Workforce Heatmap Reports**: Implement allocation charts mapping assigned tasks against team member bandwidth to identify bottleneck allocations.
