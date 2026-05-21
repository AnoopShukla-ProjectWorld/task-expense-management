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
    .query(`
      INSERT INTO projects
      (
        project_name,
        description,
        start_date,
        end_date,
        assigned_manager_id,
        priority
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @project_name,
        @description,
        @start_date,
        @end_date,
        @assigned_manager_id,
        @priority
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
      SELECT *
      FROM projects
      WHERE id = @projectId
      AND is_deleted = 0
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
}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      p.*,
      u.full_name AS manager_name
    FROM projects p

    INNER JOIN users u
      ON p.assigned_manager_id = u.id

    WHERE p.is_deleted = 0
  `;

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

  Object.entries(updateData).forEach(
    ([key, value]) => {
      fields.push(`${key} = @${key}`);
      request.input(key, value);
    }
  );

  fields.push(
    "updated_at = GETDATE()"
  );

  const query = `
    UPDATE projects
    SET ${fields.join(", ")}

    WHERE id = @projectId

    SELECT * FROM projects
    WHERE id = @projectId
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