const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// CREATE EXPENSE
// ============================================

const createExpense = async ({
  userId,
  projectId,
  assignedManagerId,
  amount,
  category,
  description,
  expenseDate,
  managerApproval = "PENDING",
  status = "PENDING",
  taskId = null,
}) => {
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("projectId", sql.Int, projectId)
    .input("assignedManagerId", sql.Int, assignedManagerId || null)
    .input("amount", sql.Decimal(18, 2), amount)
    .input("category", sql.NVarChar, category)
    .input("description", sql.NVarChar(sql.MAX), description)
    .input("expenseDate", sql.Date, expenseDate)
    .input("managerApproval", sql.NVarChar, managerApproval)
    .input("status", sql.NVarChar, status)
    .input("taskId", sql.Int, taskId || null)
    .query(`
      INSERT INTO expenses
      (
        user_id,
        project_id,
        assigned_manager_id,
        amount,
        category,
        description,
        expense_date,
        manager_approval,
        status,
        task_id
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @userId,
        @projectId,
        @assignedManagerId,
        @amount,
        @category,
        @description,
        @expenseDate,
        @managerApproval,
        @status,
        @taskId
      )
    `);

  return result.recordset[0];
};


// ============================================
// SAVE ATTACHMENT
// ============================================

const saveExpenseAttachment =
  async ({
    expenseId,
    fileName,
    filePath,
    fileSize,
    mimeType,
  }) => {
    await pool
      .request()
      .input(
        "expenseId",
        sql.Int,
        expenseId
      )
      .input(
        "fileName",
        sql.NVarChar,
        fileName
      )
      .input(
        "filePath",
        sql.NVarChar,
        filePath
      )
      .input(
        "fileSize",
        sql.BigInt,
        fileSize
      )
      .input(
        "mimeType",
        sql.NVarChar,
        mimeType
      )
      .query(`
        INSERT INTO expense_attachments
        (
          expense_id,
          file_name,
          file_path,
          file_size,
          mime_type
        )
        VALUES
        (
          @expenseId,
          @fileName,
          @filePath,
          @fileSize,
          @mimeType
        )
      `);
  };


// ============================================
// GET EXPENSE BY ID
// ============================================

const findExpenseById =
  async (expenseId) => {
    const result =
      await pool
        .request()
        .input(
          "expenseId",
          sql.Int,
          expenseId
        )
        .query(`
          SELECT *
          FROM expenses
          WHERE id = @expenseId
          AND is_deleted = 0
        `);

    return result.recordset[0];
  };


// ============================================
// UPDATE EXPENSE STATUS
// ============================================

const updateExpenseStatus =
  async ({
    expenseId,
    status,
    reviewedBy,
    rejectionReason,
    managerApproval,
    managerApprovedBy,
  }) => {
    const fields = [];
    const request = pool.request();
    request.input("expenseId", sql.Int, expenseId);

    if (status !== undefined) {
      fields.push("status = @status");
      request.input("status", sql.NVarChar, status);
    }
    if (reviewedBy !== undefined) {
      fields.push("reviewed_by = @reviewedBy");
      request.input("reviewedBy", sql.Int, reviewedBy);
      fields.push("reviewed_at = GETDATE()");
    }
    if (rejectionReason !== undefined) {
      fields.push("rejection_reason = @rejectionReason");
      request.input("rejectionReason", sql.NVarChar, rejectionReason);
    }
    if (managerApproval !== undefined) {
      fields.push("manager_approval = @managerApproval");
      request.input("managerApproval", sql.NVarChar, managerApproval);
    }
    if (managerApprovedBy !== undefined) {
      fields.push("manager_approved_by = @managerApprovedBy");
      request.input("managerApprovedBy", sql.Int, managerApprovedBy);
      fields.push("manager_reviewed_at = GETDATE()");
    }
    fields.push("updated_at = GETDATE()");

    const query = `
      UPDATE expenses
      SET ${fields.join(", ")}
      WHERE id = @expenseId
    `;
    await request.query(query);
  };


// ============================================
// GET ALL EXPENSES
// ============================================

const getExpenses = async ({
  page = 1,
  limit = 10,
  status,
  category,
  userId,
  userRole,
  my,
}) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;
  const offset = (parsedPage - 1) * parsedLimit;

  let query = `
    SELECT 
      e.*,
      CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
      u.email AS employee_email,
      CONCAT(mgr.first_name, ' ', mgr.last_name) AS manager_name,
      CONCAT(adm.first_name, ' ', adm.last_name) AS admin_name,
      p.project_name AS project_name,
      t.title AS task_title,
      a.file_name AS attachment_name,
      a.file_path AS attachment_path
    FROM expenses e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN users mgr ON e.manager_approved_by = mgr.id
    LEFT JOIN users adm ON e.reviewed_by = adm.id
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN tasks t ON e.task_id = t.id
    LEFT JOIN expense_attachments a ON e.id = a.expense_id
    WHERE e.is_deleted = 0
  `;

  if (my) {
    query += `
      AND e.user_id = @userId
    `;
  } else if (userRole === "MANAGER") {
    query += `
      AND (p.assigned_manager_id = @userId OR e.assigned_manager_id = @userId)
    `;
  } else if (userRole === "EMPLOYEE") {
    query += `
      AND e.user_id = @userId
    `;
  }

  if (status) {
    query += `
      AND e.status = @status
    `;
  }

  if (category) {
    query += `
      AND e.category = @category
    `;
  }

  query += `
    ORDER BY e.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const request = pool.request();

  request
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, parsedLimit);

  if (my || userRole === "MANAGER" || userRole === "EMPLOYEE") {
    request.input("userId", sql.Int, userId);
  }

  if (status) {
    request.input("status", sql.NVarChar(20), status);
  }

  if (category) {
    request.input("category", sql.NVarChar(50), category);
  }

  const result = await request.query(query);

  return result.recordset;
};


// ============================================
// SOFT DELETE EXPENSE
// ============================================

const softDeleteExpense =
  async (expenseId) => {
    await pool
      .request()
      .input(
        "expenseId",
        sql.Int,
        expenseId
      )
      .query(`
        UPDATE expenses
        SET
          is_deleted = 1,
          deleted_at = GETDATE()
        WHERE id = @expenseId
      `);
  };

// ============================================
// UPDATE EXPENSE FIELDS
// ============================================
const updateExpense = async (expenseId, {
  projectId,
  assignedManagerId,
  amount,
  category,
  description,
  expenseDate,
  taskId,
}) => {
  const result = await pool
    .request()
    .input("expenseId", sql.Int, expenseId)
    .input("projectId", sql.Int, projectId || null)
    .input("assignedManagerId", sql.Int, assignedManagerId || null)
    .input("amount", sql.Decimal(18, 2), amount)
    .input("category", sql.NVarChar, category)
    .input("description", sql.NVarChar(sql.MAX), description)
    .input("expenseDate", sql.Date, expenseDate)
    .input("taskId", sql.Int, taskId || null)
    .query(`
      UPDATE expenses
      SET
        project_id = @projectId,
        assigned_manager_id = @assignedManagerId,
        amount = @amount,
        category = @category,
        description = @description,
        expense_date = @expenseDate,
        task_id = @taskId,
        updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @expenseId
      AND is_deleted = 0
    `);

  return result.recordset[0];
};

// ============================================
// DELETE EXPENSE ATTACHMENTS
// ============================================
const deleteExpenseAttachments = async (expenseId) => {
  await pool
    .request()
    .input("expenseId", sql.Int, expenseId)
    .query(`
      DELETE FROM expense_attachments
      WHERE expense_id = @expenseId
    `);
};

module.exports = {
  createExpense,
  saveExpenseAttachment,
  findExpenseById,
  updateExpenseStatus,
  getExpenses,
  softDeleteExpense,
  updateExpense,
  deleteExpenseAttachments,
};