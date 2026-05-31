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
        (SELECT COUNT(*) FROM users WHERE status = 'approved' AND is_deleted = 0) AS active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'manager' AND is_deleted = 0) AS managers_count,
        (SELECT COUNT(*) FROM users WHERE role = 'employee' AND is_deleted = 0) AS employees_count,
        
        (SELECT COUNT(*) FROM projects WHERE is_deleted = 0) AS total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'ACTIVE' AND is_deleted = 0) AS active_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'ACTIVE' AND end_date < CAST(GETDATE() AS DATE) AND is_deleted = 0) AS overdue_projects,
        (SELECT ISNULL(SUM(budget), 0) FROM projects WHERE is_deleted = 0) AS total_budget_pool,
        
        (SELECT COUNT(*) FROM tasks WHERE is_deleted = 0) AS total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED' AND is_deleted = 0) AS completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'PENDING' AND is_deleted = 0) AS pending_tasks,
        
        (SELECT ISNULL(SUM(amount), 0) FROM expenses WHERE status = 'APPROVED' AND is_deleted = 0) AS total_expenses,
        (SELECT COUNT(*) FROM expenses WHERE status = 'PENDING' AND is_deleted = 0) AS pending_expenses,
        (SELECT ISNULL(SUM(amount), 0) FROM expenses WHERE status = 'PENDING' AND is_deleted = 0) AS pending_expenses_amount,
        (SELECT COUNT(*) FROM expenses WHERE status = 'PENDING' AND is_deleted = 0) AS pending_expenses_count,
        (SELECT COUNT(*) FROM expenses WHERE status = 'REJECTED' AND is_deleted = 0) AS rejected_expenses,
        
        (SELECT COUNT(*) FROM user_sessions WHERE is_active = 1) AS active_sessions
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
      WHERE created_at >= @startDate AND created_at < DATEADD(day, 1, @endDate)
        AND is_deleted = 0

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
      AND is_deleted = 0

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
  async ({ startDate, endDate } = {}) => {
    const request = pool.request();
    let query = `
      SELECT
        u.id,
        u.employee_id,
        u.email,
        d.department_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,

        COUNT(t.id) AS total_tasks,

        ISNULL(
          SUM(
            CASE
              WHEN t.status = 'COMPLETED'
              THEN 1
              ELSE 0
            END
          ), 0
        ) AS completed_tasks,

        ISNULL(
          SUM(
            CASE
              WHEN t.status IN ('PENDING', 'IN_PROGRESS', 'ON_HOLD')
              THEN 1
              ELSE 0
            END
          ), 0
        ) AS pending_tasks

      FROM users u

      LEFT JOIN departments d
        ON u.department_id = d.id

      LEFT JOIN tasks t
        ON u.id = t.assigned_to AND t.is_deleted = 0
    `;

    if (startDate && endDate) {
      query += ` AND t.created_at >= @startDate AND t.created_at < DATEADD(day, 1, @endDate) `;
      request.input("startDate", sql.Date, startDate);
      request.input("endDate", sql.Date, endDate);
    }

    query += `
      WHERE u.is_deleted = 0

      GROUP BY
        u.id,
        u.employee_id,
        u.email,
        u.first_name,
        u.last_name,
        d.department_name

      ORDER BY completed_tasks DESC
    `;

    const result = await request.query(query);

    return result.recordset;
  };


module.exports = {
  getAdminDashboardStats,
  getTaskAnalytics,
  getExpenseAnalytics,
  getProjectAnalytics,
  getUserProductivity,
};