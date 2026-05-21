const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// CREATE USER
// ============================================

const createUser = async ({
  full_name,
  email,
  employee_id,
  phone_number,
  password_hash,
  role_id,
  department_id,
}) => {
  const result = await pool
    .request()
    .input("full_name", sql.NVarChar(150), full_name)
    .input("email", sql.NVarChar(150), email)
    .input("employee_id", sql.NVarChar(50), employee_id)
    .input("phone_number", sql.NVarChar(20), phone_number)
    .input("password_hash", sql.NVarChar(255), password_hash)
    .input("role_id", sql.Int, role_id)
    .input("department_id", sql.Int, department_id || null)
    .query(`
      INSERT INTO users
      (
        full_name,
        email,
        employee_id,
        phone_number,
        password_hash,
        role_id,
        department_id
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @full_name,
        @email,
        @employee_id,
        @phone_number,
        @password_hash,
        @role_id,
        @department_id
      )
    `);

  return result.recordset[0];
};


// ============================================
// FIND USER BY EMAIL
// ============================================

const findUserByEmail = async (email) => {
  const result = await pool
    .request()
    .input("email", sql.NVarChar(150), email)
    .query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.employee_id,
        u.phone_number,
        u.password_hash,
        u.status,
        u.is_deleted,
        u.role_id,
        u.department_id,
        r.role_name,
        d.department_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = @email
        AND u.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// FIND USER BY ID
// ============================================

const findUserById = async (userId) => {
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.employee_id,
        u.phone_number,
        u.status,
        u.is_deleted,
        u.role_id,
        u.department_id,
        r.role_name,
        d.department_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = @userId
    `);

  return result.recordset[0];
};


// ============================================
// GET USERS
// ============================================

const getUsers = async ({
  page,
  limit,
  search,
  role,
  status,
}) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.employee_id,
      u.phone_number,
      u.status,
      r.role_name,
      d.department_name,
      u.created_at
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_deleted = 0
  `;

  if (search) {
    query += `
      AND (
        u.full_name LIKE '%' + @search + '%'
        OR u.email LIKE '%' + @search + '%'
      )
    `;
  }

  if (role) {
    query += ` AND r.role_name = @role `;
  }

  if (status) {
    query += ` AND u.status = @status `;
  }

  query += `
    ORDER BY u.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const request = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);

  if (search) request.input("search", sql.NVarChar, search);
  if (role) request.input("role", sql.NVarChar, role);
  if (status) request.input("status", sql.NVarChar, status);

  const result = await request.query(query);

  return result.recordset;
};


// ============================================
// UPDATE USER
// ============================================

const updateUser = async (userId, data) => {
  const fields = [];
  const request = pool.request();

  request.input("userId", sql.Int, userId);

  Object.entries(data).forEach(([key, value]) => {
    fields.push(`${key} = @${key}`);
    request.input(key, value);
  });

  fields.push("updated_at = GETDATE()");

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = @userId

    SELECT
      u.id,
      u.full_name,
      u.email,
      u.employee_id,
      u.phone_number,
      u.status,
      r.role_name,
      d.department_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = @userId
  `;

  const result = await request.query(query);

  return result.recordset[0];
};


// ============================================
// SOFT DELETE USER
// ============================================

const softDeleteUser = async (userId) => {
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE users
      SET
        is_deleted = 1,
        deleted_at = GETDATE()
      WHERE id = @userId
    `);
};


// ============================================
// RESTORE USER
// ============================================

const restoreUser = async (userId) => {
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE users
      SET
        is_deleted = 0,
        deleted_at = NULL
      WHERE id = @userId
    `);
};


module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getUsers,
  updateUser,
  softDeleteUser,
  restoreUser,
};