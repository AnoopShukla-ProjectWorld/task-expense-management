# My Project Self-Audit & Implementation Notes
**PROJECT**: Task & Expense Management Hub  
**DEVELOPER NOTES**: Anoop Shukla  
**LAST UPDATED**: May 31, 2026  

---

## 📝 Overview of the Project
I reviewed the entire codebase of the **Task & Expense Management System** to find bugs, security risks, performance bottlenecks, and layout issues. The project is divided into:
* **Frontend**: React 19, Vite, Tailwind CSS, and React Query.
* **Backend**: Node.js, Express.js, MSSQL (SQL Server) with connection pooling, and JWT cookies for session security.

I went through the folders step-by-step, fixed several UI breaks, tested the security of database requests, and logged my findings here.

---

## 🔒 1. Security Analysis & Patches

### A. CAPTCHA Style & Contrast Fixes
* **The Problem**: The Admin Login page had styling conflicts. When a dark background or card layout was applied, the text inside the CAPTCHA canvas became unreadable or invisible. This blocked the admin from logging in correctly.
* **Fix Done**: 
  * I fixed the styles in `AdminLoginPage.jsx` and `LoginPage.jsx` to make sure the CAPTCHA canvas always renders with high-contrast text.
  * Verified that the canvas draws properly on both desktop and mobile views. The refresh handler resets the security token on the backend synchronously.

### B. SQL Injection Security Check
* **Check**: I went through the backend repositories (`userRepository.js`, `taskRepository.js`, `projectRepository.js`) to see how raw database queries are made.
* **Result**: Safe. The queries do not use raw string concatenation (which is vulnerable to SQL injection). Instead, they all use parameterized inputs:
  ```javascript
  request.input("email", sql.VarChar, email)
  ```
* **Note for Future**: Any new query I write in the future must continue to use `request.input()` rather than inserting variables directly into the query string.

### C. Session & Cookie Security
* **Check**: Examined how JWT tokens are issued in `authController.js` and how they are configured in `cookieConfig.js`.
* **Result**: The cookies are set with `httpOnly: true` (which stops scripts from stealing the session token) and `sameSite: "lax"` (helps block CSRF).
* **Fix needed in Production**: Currently, `secure` is set dynamically. When putting the app online on a real server with HTTPS, `secure: true` must be strictly enabled so cookies are only sent over encrypted connections.

---

## ⚡ 2. Performance Issues Found & Solved

### A. Keystroke API Overload in Search Box
* **The Problem**: On the Audit Logs page, typing in the search box was triggering an API request to the SQL Server database on *every single keystroke*. If a user typed "admin", it made 5 separate API calls in a split second, which can easily crash the server if multiple users are active.
* **Fix Done**: 
  * Overhauled `AuditLogsPage.jsx`. I separated the search input value from the active query state.
  * The search is now only triggered when the user hits the "Search" button or presses "Enter", which reduced unnecessary database queries to just one.
* **Remaining Task**: The search bars in `UsersPage.jsx` and `TasksPage.jsx` still run queries on every keystroke. I need to implement the same button/debounced search logic there to save database load.

### B. UI Lag in Large Tables (Missing Pagination)
* **The Problem**: Loading thousands of records in a single flat list makes the browser lag when scrolling.
* **Fix Done**: Added standard client-side pagination on the Audit Logs Timeline. It now displays **15 logs per page**, resolving the scrolling stutter.
* **Remaining Task**: The list view in `TasksPage.jsx` and the main `ExpensesPage.jsx` table still load everything at once. I should add a simple 15-item paginator there when the data grows.

---

## 🎨 3. UI/UX & Layout Fixes

### A. Responsive Elements Cutoff on Mobile
* **The Problem**: 
  * The notifications dropdown in the Navbar was using `absolute right-0`. On screen widths below `360px`, the panel bled off the left edge, hiding text and links.
  * The AI chat drawer (`AICopilotWidget.jsx`) was using fixed widths that overflew small viewports.
* **Fix Done**:
  * Changed the Navbar dropdown classes in `Navbar.jsx` to utilize a `fixed` layout with safe horizontal bounds (`left-4 right-4`) on mobile, while keeping `absolute right-0` on larger screens.
  * Adjusted `AICopilotWidget.jsx` drawer sizes so it scales cleanly on small screens without bleeding off-screen.
  * Wrapped the 7-column calendar grid in `TasksPage.jsx` inside a `min-w-[700px]` scrollable container so users can swipe horizontally on mobile instead of seeing columns get squished.

### B. Standardizing Colors (Theme Fixes)
* **The Problem**: Discovered a few hardcoded colors (`bg-slate-50`, `border-slate-200`) in dashboard components.
* **Fix Done**: Replaced them with CSS HSL variables (`var(--border-color)`, `var(--bg-secondary)`) to keep the light theme looking uniform.

---

## 🛠️ 4. Future Roadmap & Updates

Things I plan to add next to make the system more advanced:
1. **Real-time Notifications (WebSockets)**: Integrate `socket.io` so admins get live push notifications when an employee submits an expense, instead of manual refreshing.
2. **Inline Receipt Preview**: Add an image modal in the Expenses page so managers can view uploaded receipt files directly in the browser instead of downloading them.
3. **Bandwidth Heatmap**: A visual chart in the Reports section to see which employee is overloaded with tasks and who has free bandwidth.
