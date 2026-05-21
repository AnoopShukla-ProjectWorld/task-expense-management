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
  amount,
  category,
  description,
  expenseDate,
}) => {
  const result = await pool
    .request()
    .input(
      "userId",
      sql.Int,
      userId
    )
    .input(
      "projectId",
      sql.Int,
      projectId
    )
    .input(
      "amount",
      sql.Decimal(18, 2),
      amount
    )
    .input(
      "category",
      sql.NVarChar,
      category
    )
    .input(
      "description",
      sql.NVarChar(sql.MAX),
      description
    )
    .input(
      "expenseDate",
      sql.Date,
      expenseDate
    )
    .query(`
      INSERT INTO expenses
      (
        user_id,
        project_id,
        amount,
        category,
        description,
        expense_date
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @userId,
        @projectId,
        @amount,
        @category,
        @description,
        @expenseDate
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
  }) => {
    await pool
      .request()
      .input(
        "expenseId",
        sql.Int,
        expenseId
      )
      .input(
        "status",
        sql.NVarChar,
        status
      )
      .input(
        "reviewedBy",
        sql.Int,
        reviewedBy
      )
      .input(
        "rejectionReason",
        sql.NVarChar,
        rejectionReason
      )
      .query(`
        UPDATE expenses

        SET
          status = @status,
          reviewed_by = @reviewedBy,
          reviewed_at = GETDATE(),
          rejection_reason = @rejectionReason,
          updated_at = GETDATE()

        WHERE id = @expenseId
      `);
  };


// ============================================
// GET ALL EXPENSES
// ============================================

const getExpenses = async ({
  page,
  limit,
  status,
  category,
}) => {
  const offset =
    (page - 1) * limit;

  let query = `
    SELECT *
    FROM expenses
    WHERE is_deleted = 0
  `;

  if (status) {
    query += `
      AND status = '${status}'
    `;
  }

  if (category) {
    query += `
      AND category = '${category}'
    `;
  }

  query += `
    ORDER BY created_at DESC
    OFFSET ${offset} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `;

  const result = await pool
    .request()
    .query(query);

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

module.exports = {
  createExpense,
  saveExpenseAttachment,
  findExpenseById,
  updateExpenseStatus,
  getExpenses,
  softDeleteExpense,
};