const sql = require("mssql");

const { pool } = require("../config/db");


// ============================================
// ADMIN DASHBOARD KPIs
// ============================================

const getAdminDashboardStats =
  async () => {
    const result =
      await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_deleted = 0) AS total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE' AND is_deleted = 0) AS active_users,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'MANAGER' AND u.is_deleted = 0) AS managers_count,
        (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'EMPLOYEE' AND u.is_deleted = 0) AS employees_count,
        
        (SELECT COUNT(*) FROM projects WHERE is_deleted = 0) AS total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'ACTIVE' AND is_deleted = 0) AS active_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'ACTIVE' AND end_date < CAST(GETDATE() AS DATE) AND is_deleted = 0) AS overdue_projects,
        
        (SELECT COUNT(*) FROM tasks WHERE is_deleted = 0) AS total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED' AND is_deleted = 0) AS completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'PENDING' AND is_deleted = 0) AS pending_tasks,
        
        (SELECT COUNT(*) FROM expenses WHERE is_deleted = 0) AS total_expenses,
        (SELECT COUNT(*) FROM expenses WHERE status = 'PENDING' AND is_deleted = 0) AS pending_expenses,
        (SELECT COUNT(*) FROM expenses WHERE status = 'REJECTED' AND is_deleted = 0) AS rejected_expenses,
        
        (SELECT COUNT(*) FROM sessions WHERE is_active = 1) AS active_sessions
    `);

    return result.recordset[0];
  };


// ============================================
// TASK ANALYTICS
// ============================================

const getTaskAnalytics =
  async ({
    startDate,
    endDate,
  }) => {
    const request =
      pool.request();

    request
      .input(
        "startDate",
        sql.Date,
        startDate
      )
      .input(
        "endDate",
        sql.Date,
        endDate
      );

    const result =
      await request.query(`
      SELECT
        status,
        COUNT(*) AS total
      FROM tasks
      WHERE created_at
      BETWEEN @startDate
      AND @endDate

      GROUP BY status
    `);

    return result.recordset;
  };


// ============================================
// EXPENSE ANALYTICS
// ============================================

const getExpenseAnalytics =
  async ({
    startDate,
    endDate,
  }) => {
    const request =
      pool.request();

    request
      .input(
        "startDate",
        sql.Date,
        startDate
      )
      .input(
        "endDate",
        sql.Date,
        endDate
      );

    const result =
      await request.query(`
      SELECT
        category,
        SUM(amount) AS total_amount
      FROM expenses
      WHERE expense_date
      BETWEEN @startDate
      AND @endDate

      GROUP BY category
    `);

    return result.recordset;
  };


// ============================================
// PROJECT ANALYTICS
// ============================================

const getProjectAnalytics =
  async () => {
    const result =
      await pool.request().query(`
      SELECT
        status,
        COUNT(*) AS total
      FROM projects
      WHERE is_deleted = 0
      GROUP BY status
    `);

    return result.recordset;
  };


// ============================================
// USER PRODUCTIVITY REPORT
// ============================================

const getUserProductivity =
  async () => {
    const result =
      await pool.request().query(`
      SELECT
        u.id,
        u.full_name,

        COUNT(t.id) AS total_tasks,

        SUM(
          CASE
            WHEN t.status = 'COMPLETED'
            THEN 1
            ELSE 0
          END
        ) AS completed_tasks

      FROM users u

      LEFT JOIN tasks t
        ON u.id = t.assigned_to

      WHERE u.is_deleted = 0

      GROUP BY
        u.id,
        u.full_name

      ORDER BY completed_tasks DESC
    `);

    return result.recordset;
  };


module.exports = {
  getAdminDashboardStats,
  getTaskAnalytics,
  getExpenseAnalytics,
  getProjectAnalytics,
  getUserProductivity,
};