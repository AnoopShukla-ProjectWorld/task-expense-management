const { pool } = require("../config/db");

/**
 * Compile a deep, structured, relational database context of the entire portal.
 * This is injected into Gemini to allow mathematically accurate project-level audits.
 */
const getDatabaseContextSummary = async () => {
  try {
    const request = pool.request();

    // 1. Fetch ALL Active Users
    const usersResult = await request.query(`
      SELECT 
        u.id, 
        CONCAT(u.first_name, ' ', u.last_name) AS full_name, 
        u.email, 
        u.role, 
        u.status, 
        COALESCE(d.department_name, 'Unassigned') AS department
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.is_deleted = 0
      ORDER BY u.role, u.id
    `);

    // 2. Fetch ALL Active Projects with detailed budgets and progress
    const projectsResult = await request.query(`
      SELECT 
        p.id, 
        p.project_name, 
        p.status, 
        p.priority, 
        p.budget, 
        COALESCE(
          p.manual_completion_percentage, 
          (
            SELECT COALESCE(AVG(CAST(t.completion_percentage AS FLOAT)), 0)
            FROM tasks t
            WHERE t.project_id = p.id AND t.is_deleted = 0
          )
        ) AS completion_percentage,
        (
          SELECT COALESCE(SUM(e.amount), 0)
          FROM expenses e
          WHERE e.project_id = p.id AND e.status = 'APPROVED' AND e.is_deleted = 0
        ) AS budget_utilization,
        CONCAT(u.first_name, ' ', u.last_name) AS manager_name
      FROM projects p
      LEFT JOIN users u ON p.assigned_manager_id = u.id
      WHERE p.is_deleted = 0
      ORDER BY p.id
    `);

    // 3. Fetch ALL Active Tasks (Assignments & Workloads)
    const tasksResult = await request.query(`
      SELECT 
        t.id, 
        t.title, 
        p.project_name, 
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_to, 
        t.status, 
        t.completion_percentage, 
        t.due_date
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.is_deleted = 0
      ORDER BY t.project_id, t.id
    `);

    // 4. Fetch ALL Active Expenses (Approved & Pending)
    const expensesResult = await request.query(`
      SELECT 
        e.id, 
        e.category, 
        e.amount, 
        e.status, 
        p.project_name, 
        CONCAT(u.first_name, ' ', u.last_name) AS claimant, 
        e.created_at AS submitted_at
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.is_deleted = 0
      ORDER BY e.created_at DESC
    `);

    // 5. Fetch Latest Portal Audit Logs
    const auditLogsResult = await request.query(`
      SELECT TOP 20
        a.id, 
        CONCAT(u.first_name, ' ', u.last_name) AS username, 
        a.action, 
        a.entity_name,
        a.entity_id,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);

    // Start compiling full structured Markdown Ledger
    let summary = `### ENTERPRISE SYSTEM RELATION DIRECTORY (REAL-TIME POOLS)\n\n`;

    // A. Users Table
    summary += `#### 👥 REGISTERED PORTAL USERS DIRECTORY\n`;
    if (usersResult.recordset.length === 0) {
      summary += `* No registered users located.\n`;
    } else {
      summary += `| ID | Full Name | Email | Role | Status | Department |\n|---|---|---|---|---|---|\n`;
      usersResult.recordset.forEach(u => {
        summary += `| ${u.id} | ${u.full_name} | ${u.email} | ${u.role} | ${u.status} | ${u.department} |\n`;
      });
    }
    summary += `\n`;

    // B. Projects Table
    summary += `#### 📁 CORPORATE PROJECTS LEDGER\n`;
    if (projectsResult.recordset.length === 0) {
      summary += `* No active projects registered.\n`;
    } else {
      summary += `| ID | Project Name | Status | Priority | Budget Allocated | Approved Spent | Completion % | Assigned Manager |\n|---|---|---|---|---|---|---|---|\n`;
      projectsResult.recordset.forEach(p => {
        const budget = p.budget ? `₹${parseFloat(p.budget).toLocaleString("en-IN")}` : "Unlimited";
        const spent = `₹${parseFloat(p.budget_utilization || 0).toLocaleString("en-IN")}`;
        const completion = `${Math.round(p.completion_percentage || 0)}%`;
        summary += `| ${p.id} | ${p.project_name} | ${p.status} | ${p.priority} | ${budget} | ${spent} | ${completion} | ${p.manager_name || "Unassigned"} |\n`;
      });
    }
    summary += `\n`;

    // C. Tasks Table
    summary += `#### 📋 OPERATIONAL TASKS & WORKLOAD CATALOG\n`;
    if (tasksResult.recordset.length === 0) {
      summary += `* No tasks assigned in the system.\n`;
    } else {
      summary += `| ID | Task Title | Parent Project | Assigned Employee | Status | Completion % | Due Date |\n|---|---|---|---|---|---|---|\n`;
      tasksResult.recordset.forEach(t => {
        const dueDate = t.due_date ? new Date(t.due_date).toLocaleDateString("en-IN") : "No Limit";
        summary += `| ${t.id} | ${t.title} | ${t.project_name || "Unlinked"} | ${t.assigned_to || "Unassigned"} | ${t.status} | ${t.completion_percentage}% | ${dueDate} |\n`;
      });
    }
    summary += `\n`;

    // D. Expenses Table
    summary += `#### 💰 FINANCIAL CLAIMS LEDGER (EXPENSES)\n`;
    if (expensesResult.recordset.length === 0) {
      summary += `* No expense claims filed.\n`;
    } else {
      summary += `| ID | Category | Claimed Amount | Status | Project | Claimant Employee | Submitted At |\n|---|---|---|---|---|---|---|\n`;
      expensesResult.recordset.forEach(e => {
        const amount = `₹${parseFloat(e.amount).toLocaleString("en-IN")}`;
        const submitted = e.submitted_at ? new Date(e.submitted_at).toLocaleDateString("en-IN") : "Unknown";
        summary += `| ${e.id} | ${e.category} | ${amount} | ${e.status} | ${e.project_name || "Unlinked"} | ${e.claimant || "Unassigned"} | ${submitted} |\n`;
      });
    }
    summary += `\n`;

    // E. Audit Logs Table
    summary += `#### 🚨 RECENT PORTAL AUDIT ACTIVITIES\n`;
    if (auditLogsResult.recordset.length === 0) {
      summary += `* Zero audit trails located.\n`;
    } else {
      summary += `| ID | Action Performed | Username | Impacted Entity | Timestamp |\n|---|---|---|---|---|\n`;
      auditLogsResult.recordset.forEach(a => {
        const time = a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : "Unknown";
        const details = `${a.entity_name || "System"} (ID: ${a.entity_id || "N/A"})`;
        summary += `| ${a.id} | ${a.action} | ${a.username || "System"} | ${details} | ${time} |\n`;
      });
    }
    summary += `\n`;

    summary += `You have access to the absolute, complete factual relational ledger of the database. When answering admin queries (e.g., list overdue tasks, total users, budget spent, or workloads), do NOT guess, hallucinate, or summarize if details are present in the tables above. Always use the exact table entries and do precise math. For high-level reasoning, risk-assessment, summaries, and strategic advice, utilize the full capability of Gemini analysis.`;
    return summary;
  } catch (error) {
    console.error("Failed to compile database context summary for AI:", error);
    return "Error compiling system facts: SQL Database connection error.";
  }
};

module.exports = {
  getDatabaseContextSummary,
};
