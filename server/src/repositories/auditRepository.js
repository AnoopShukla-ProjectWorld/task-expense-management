const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// CREATE AUDIT LOG
// ============================================

const createAuditLog = async ({
  user_id = null,
  action,
  entity_name,
  entity_id = null,
  old_values = null,
  new_values = null,
  ip_address = null,
}) => {
  await pool
    .request()

    .input(
      "user_id",
      sql.Int,
      user_id
    )

    .input(
      "action",
      sql.NVarChar(255),
      action
    )

    .input(
      "entity_name",
      sql.NVarChar(100),
      entity_name
    )

    .input(
      "entity_id",
      sql.Int,
      entity_id
    )

    .input(
      "old_values",
      sql.NVarChar(sql.MAX),
      old_values
        ? JSON.stringify(old_values)
        : null
    )

    .input(
      "new_values",
      sql.NVarChar(sql.MAX),
      new_values
        ? JSON.stringify(new_values)
        : null
    )

    .input(
      "ip_address",
      sql.NVarChar(100),
      ip_address
    )

    .query(`
      INSERT INTO audit_logs
      (
        user_id,
        action,
        entity_name,
        entity_id,
        old_values,
        new_values,
        ip_address
      )

      VALUES
      (
        @user_id,
        @action,
        @entity_name,
        @entity_id,
        @old_values,
        @new_values,
        @ip_address
      )
    `);
};


// ============================================
// GET AUDIT LOGS
// ============================================

const getAuditLogs = async ({
  page = 1,
  limit = 10,
  search = "",
}) => {
  const offset =
    (page - 1) * limit;

  const request =
    pool.request();

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

  let searchQuery = "";

  if (search) {
    request.input(
      "search",
      sql.NVarChar(255),
      `%${search}%`
    );

    searchQuery = `
      AND (
        al.action LIKE @search
        OR al.entity_name LIKE @search
        OR u.full_name LIKE @search
      )
    `;
  }

  const result =
    await request.query(`
      SELECT
        al.id,
        al.user_id,
        al.action,
        al.entity_name,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.created_at,

        u.full_name,
        u.email

      FROM audit_logs al

      LEFT JOIN users u
        ON al.user_id = u.id

      WHERE 1 = 1
      ${searchQuery}

      ORDER BY al.created_at DESC

      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};


module.exports = {
  createAuditLog,
  getAuditLogs,
};