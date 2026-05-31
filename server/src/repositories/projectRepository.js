const sql = require("mssql");

const { pool } = require("../config/db");


// ============================================
// CREATE PROJECT
// ============================================

const createProject = async ({
  project_name,
  description,
  start_date,
  end_date,
  assigned_manager_id,
  priority,
  document_path,
}) => {
  const result = await pool
    .request()
    .input(
      "project_name",
      sql.NVarChar(150),
      project_name
    )
    .input(
      "description",
      sql.NVarChar(sql.MAX),
      description
    )
    .input(
      "start_date",
      sql.Date,
      start_date
    )
    .input(
      "end_date",
      sql.Date,
      end_date
    )
    .input(
      "assigned_manager_id",
      sql.Int,
      assigned_manager_id
    )
    .input(
      "priority",
      sql.NVarChar(20),
      priority
    )
    .input(
      "document_path",
      sql.NVarChar(500),
      document_path || null
    )
    .query(`
      INSERT INTO projects
      (
        project_name,
        description,
        start_date,
        end_date,
        assigned_manager_id,
        priority,
        document_path
      )
 
      OUTPUT INSERTED.*
 
      VALUES
      (
        @project_name,
        @description,
        @start_date,
        @end_date,
        @assigned_manager_id,
        @priority,
        @document_path
      )
    `);

  return result.recordset[0];
};


// ============================================
// FIND PROJECT BY ID
// ============================================

const findProjectById = async (
  projectId
) => {
  const result = await pool
    .request()
    .input(
      "projectId",
      sql.Int,
      projectId
    )
    .query(`
      SELECT 
        p.id, p.project_name, p.description, p.start_date, p.end_date, p.status, p.priority, p.assigned_manager_id, p.budget, p.document_path, p.created_at, p.updated_at, p.manual_completion_percentage,
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
        ) AS budget_utilization
      FROM projects p
      WHERE p.id = @projectId
      AND p.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// GET ALL PROJECTS
// ============================================

const getProjects = async ({
  page,
  limit,
  search,
  status,
  userId,
  userRole,
}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      p.id, p.project_name, p.description, p.start_date, p.end_date, p.status, p.priority, p.assigned_manager_id, p.budget, p.document_path, p.created_at, p.updated_at, p.manual_completion_percentage,
      CONCAT(u.first_name, ' ', u.last_name) AS manager_name,
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
      ) AS budget_utilization
    FROM projects p

    INNER JOIN users u
      ON p.assigned_manager_id = u.id

    WHERE p.is_deleted = 0
  `;

  if (userRole === "MANAGER") {
    query += `
      AND p.assigned_manager_id = @userId
    `;
  } else if (userRole === "EMPLOYEE") {
    query += `
      AND p.id IN (SELECT project_id FROM project_members WHERE user_id = @userId)
    `;
  }

  if (search) {
    query += `
      AND p.project_name LIKE '%' + @search + '%'
    `;
  }

  if (status) {
    query += `
      AND p.status = @status
    `;
  }

  query += `
    ORDER BY p.created_at DESC

    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const request = pool.request();

  request
    .input(
      "offset",
      sql.Int,
      offset
    )
    .input(
      "limit",
      sql.Int,
      limit
    );

  if (userRole === "MANAGER" || userRole === "EMPLOYEE") {
    request.input(
      "userId",
      sql.Int,
      userId
    );
  }

  if (search) {
    request.input(
      "search",
      sql.NVarChar(150),
      search
    );
  }

  if (status) {
    request.input(
      "status",
      sql.NVarChar(20),
      status
    );
  }

  const result =
    await request.query(query);

  return result.recordset;
};


// ============================================
// UPDATE PROJECT
// ============================================

const updateProject = async (
  projectId,
  updateData
) => {
  const fields = [];
  const request = pool.request();

  request.input(
    "projectId",
    sql.Int,
    projectId
  );

  const allowedColumns = [
    "project_name",
    "description",
    "start_date",
    "end_date",
    "status",
    "priority",
    "assigned_manager_id",
    "budget",
    "completion_percentage",
    "manual_completion_percentage",
    "document_path",
  ];

  Object.entries(updateData).forEach(
    ([key, value]) => {
      if (allowedColumns.includes(key) && value !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, value);
      }
    }
  );

  fields.push(
    "updated_at = GETDATE()"
  );

  const query = `
    UPDATE projects
    SET ${fields.join(", ")}

    WHERE id = @projectId

    SELECT
      p.id, p.project_name, p.description, p.start_date, p.end_date, p.status, p.priority, p.assigned_manager_id, p.budget, p.document_path, p.created_at, p.updated_at, p.manual_completion_percentage,
      CONCAT(u.first_name, ' ', u.last_name) AS manager_name,
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
      ) AS budget_utilization
    FROM projects p
    LEFT JOIN users u ON p.assigned_manager_id = u.id
    WHERE p.id = @projectId
  `;

  const result =
    await request.query(query);

  return result.recordset[0];
};


// ============================================
// SOFT DELETE PROJECT
// ============================================

const deleteProject = async (
  projectId
) => {
  await pool
    .request()
    .input(
      "projectId",
      sql.Int,
      projectId
    )
    .query(`
      UPDATE projects
      SET
        is_deleted = 1,
        deleted_at = GETDATE()

      WHERE id = @projectId
    `);
};


// ============================================
// RESTORE PROJECT
// ============================================

const restoreProject = async (
  projectId
) => {
  await pool
    .request()
    .input(
      "projectId",
      sql.Int,
      projectId
    )
    .query(`
      UPDATE projects
      SET
        is_deleted = 0,
        deleted_at = NULL

      WHERE id = @projectId
    `);
};

module.exports = {
  createProject,
  findProjectById,
  getProjects,
  updateProject,
  deleteProject,
  restoreProject,
};