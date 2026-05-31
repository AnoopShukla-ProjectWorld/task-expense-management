const sql = require("mssql");

const { pool } = require("../config/db");


// ============================================
// CREATE TASK
// ============================================

const createTask = async ({
  project_id,
  assigned_to,
  assigned_by,
  title,
  description,
  start_date,
  due_date,
  priority,
  document_path,
}) => {
  const result = await pool
    .request()
    .input(
      "project_id",
      sql.Int,
      project_id
    )
    .input(
      "assigned_to",
      sql.Int,
      assigned_to
    )
    .input(
      "assigned_by",
      sql.Int,
      assigned_by
    )
    .input(
      "title",
      sql.NVarChar(200),
      title
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
      "due_date",
      sql.Date,
      due_date
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
      INSERT INTO tasks
      (
        project_id,
        assigned_to,
        assigned_by,
        title,
        description,
        start_date,
        due_date,
        priority,
        document_path
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @project_id,
        @assigned_to,
        @assigned_by,
        @title,
        @description,
        @start_date,
        @due_date,
        @priority,
        @document_path
      )
    `);

  return result.recordset[0];
};


// ============================================
// FIND TASK BY ID
// ============================================

const findTaskById = async (
  taskId
) => {
  const result = await pool
    .request()
    .input(
      "taskId",
      sql.Int,
      taskId
    )
    .query(`
      SELECT 
        t.*,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name,
        CONCAT(ub.first_name, ' ', ub.last_name) AS assigned_by_name,
        p.project_name
      FROM tasks t
      INNER JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users ub ON t.assigned_by = ub.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = @taskId
      AND t.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// GET TASKS
// ============================================

const getTasks = async ({
  page,
  limit,
  search,
  status,
  assigned_to,
  userId,
  userRole,
}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      t.*,
      CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name,
      CONCAT(ub.first_name, ' ', ub.last_name) AS assigned_by_name,
      p.project_name
    FROM tasks t

    INNER JOIN users u
      ON t.assigned_to = u.id

    LEFT JOIN users ub
      ON t.assigned_by = ub.id

    LEFT JOIN projects p
      ON t.project_id = p.id

    WHERE t.is_deleted = 0
  `;

  if (userRole === "MANAGER") {
    query += `
      AND (p.assigned_manager_id = @userId OR t.assigned_to = @userId)
    `;
  } else if (userRole === "EMPLOYEE") {
    query += `
      AND t.assigned_to = @userId
    `;
  }

  if (search) {
    query += `
      AND t.title LIKE '%' + @search + '%'
    `;
  }

  if (status) {
    query += `
      AND t.status = @status
    `;
  }

  if (assigned_to && userRole !== "EMPLOYEE") {
    query += `
      AND t.assigned_to = @assigned_to
    `;
  }

  query += `
    ORDER BY t.created_at DESC

    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const request = pool.request();

  request
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  if (userRole === "MANAGER" || userRole === "EMPLOYEE") {
    request.input("userId", sql.Int, userId);
  }

  if (search) {
    request.input(
      "search",
      sql.NVarChar(200),
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

  if (assigned_to && userRole !== "EMPLOYEE") {
    request.input(
      "assigned_to",
      sql.Int,
      assigned_to
    );
  }

  const result =
    await request.query(query);

  return result.recordset;
};


// ============================================
// UPDATE TASK
// ============================================

const updateTask = async (
  taskId,
  updateData
) => {
  const request = pool.request();

  request.input(
    "taskId",
    sql.Int,
    taskId
  );

  const fields = [];
  const allowedColumns = [
    "project_id",
    "assigned_to",
    "assigned_by",
    "title",
    "description",
    "start_date",
    "due_date",
    "status",
    "priority",
    "completion_percentage",
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
    UPDATE tasks
    SET ${fields.join(", ")}

    WHERE id = @taskId

    SELECT *
    FROM tasks
    WHERE id = @taskId
  `;

  const result =
    await request.query(query);

  return result.recordset[0];
};


// ============================================
// DELETE TASK
// ============================================

const deleteTask = async (
  taskId
) => {
  await pool
    .request()
    .input(
      "taskId",
      sql.Int,
      taskId
    )
    .query(`
      UPDATE tasks
      SET
        is_deleted = 1,
        deleted_at = GETDATE()

      WHERE id = @taskId
    `);
};


// ============================================
// RESTORE TASK
// ============================================

const restoreTask = async (
  taskId
) => {
  await pool
    .request()
    .input(
      "taskId",
      sql.Int,
      taskId
    )
    .query(`
      UPDATE tasks
      SET
        is_deleted = 0,
        deleted_at = NULL

      WHERE id = @taskId
    `);
};


// ============================================
// ADD TASK COMMENT
// ============================================

const addTaskComment = async ({
  task_id,
  user_id,
  comment,
}) => {
  const result = await pool
    .request()
    .input(
      "task_id",
      sql.Int,
      task_id
    )
    .input(
      "user_id",
      sql.Int,
      user_id
    )
    .input(
      "comment",
      sql.NVarChar(sql.MAX),
      comment
    )
    .query(`
      INSERT INTO task_comments
      (
        task_id,
        user_id,
        comment
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @task_id,
        @user_id,
        @comment
      )
    `);

  return result.recordset[0];
};


// ============================================
// GET TASK COMMENTS
// ============================================

const getTaskComments = async (
  taskId
) => {
  const result = await pool
    .request()
    .input(
      "taskId",
      sql.Int,
      taskId
    )
    .query(`
      SELECT
        tc.*,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name
      FROM task_comments tc

      INNER JOIN users u
        ON tc.user_id = u.id

      WHERE tc.task_id = @taskId

      ORDER BY tc.created_at ASC
    `);

  return result.recordset;
};


// ============================================
// GET OVERDUE TASKS
// ============================================

const getOverdueTasks = async () => {
  const result = await pool
    .request()
    .query(`
      SELECT *
      FROM tasks

      WHERE due_date < CAST(GETDATE() AS DATE)

      AND status != 'COMPLETED'

      AND is_deleted = 0
    `);

  return result.recordset;
};

module.exports = {
  createTask,
  findTaskById,
  getTasks,
  updateTask,
  deleteTask,
  restoreTask,

  addTaskComment,
  getTaskComments,

  getOverdueTasks,
};