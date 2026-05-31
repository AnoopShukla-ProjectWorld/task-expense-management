const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// CREATE USER
// ============================================

// ============================================
// CREATE USER
// ============================================

const createUser = async ({
  first_name,
  last_name,
  email,
  employee_id = null,
  mobile_number,
  gender,
  date_of_birth,
  password_hash,
  role = null,
  status = "pending",
  email_verified = 0,
  department_id = null,
}) => {
  const result = await pool
    .request()
    .input("first_name", sql.NVarChar(100), first_name)
    .input("last_name", sql.NVarChar(100), last_name)
    .input("email", sql.NVarChar(150), email)
    .input("employee_id", sql.NVarChar(50), employee_id || null)
    .input("mobile_number", sql.NVarChar(20), mobile_number)
    .input("gender", sql.NVarChar(20), gender)
    .input("date_of_birth", sql.Date, date_of_birth)
    .input("password_hash", sql.NVarChar(255), password_hash)
    .input("role", sql.NVarChar(50), role)
    .input("status", sql.NVarChar(20), status)
    .input("email_verified", sql.Bit, email_verified)
    .input("department_id", sql.Int, department_id || null)
    .query(`
      INSERT INTO users
      (
        first_name,
        last_name,
        email,
        employee_id,
        mobile_number,
        gender,
        date_of_birth,
        password_hash,
        role,
        status,
        email_verified,
        department_id
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @first_name,
        @last_name,
        @email,
        @employee_id,
        @mobile_number,
        @gender,
        @date_of_birth,
        @password_hash,
        @role,
        @status,
        @email_verified,
        @department_id
      )
    `);

  const createdUser = result.recordset[0];
  if (createdUser) {
    createdUser.full_name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
  }
  return createdUser;
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
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.employee_id,
        u.mobile_number,
        u.gender,
        u.date_of_birth,
        u.password_hash,
        u.profile_image,
        u.status,
        u.role,
        u.email_verified,
        u.is_deleted,
        u.department_id,
        d.department_name
      FROM users u
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
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.employee_id,
        u.mobile_number,
        u.gender,
        u.date_of_birth,
        u.profile_image,
        u.status,
        u.role,
        u.email_verified,
        u.is_deleted,
        u.department_id,
        d.department_name
      FROM users u
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
} = {}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Number(limit) || 100000);
  const offset = (parsedPage - 1) * parsedLimit;

  let query = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name, ' ', u.last_name) AS full_name,
      u.email,
      u.employee_id,
      u.mobile_number,
      u.gender,
      u.date_of_birth,
      u.profile_image,
      u.status,
      u.role,
      u.email_verified,
      d.department_name,
      u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_deleted = 0
  `;

  if (search) {
    query += `
      AND (
        (u.first_name LIKE '%' + @search + '%' OR u.last_name LIKE '%' + @search + '%')
        OR u.email LIKE '%' + @search + '%'
      )
    `;
  }

  if (role) {
    query += ` AND u.role = @role `;
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
    .input("limit", sql.Int, parsedLimit);

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

  const allowedColumns = [
    "first_name",
    "last_name",
    "email",
    "employee_id",
    "password_hash",
    "profile_image",
    "department_id",
    "status",
    "role",
    "gender",
    "date_of_birth",
    "mobile_number",
    "email_verified",
    "failed_login_attempts",
    "account_locked_until",
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedColumns.includes(key) && value !== undefined) {
      fields.push(`${key} = @${key}`);
      request.input(key, value);
    }
  });

  fields.push("updated_at = GETDATE()");

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = @userId

    SELECT
      u.id,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name, ' ', u.last_name) AS full_name,
      u.email,
      u.employee_id,
      u.mobile_number,
      u.gender,
      u.date_of_birth,
      u.profile_image,
      u.status,
      u.role,
      u.email_verified,
      d.department_name
    FROM users u
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


// ============================================
// GET NEXT EMPLOYEE ID (AUTOMATIC SEQUENCE)
// ============================================

const getNextEmployeeId = async () => {
  const result = await pool.request().query(`
    SELECT TOP 1 employee_id 
    FROM users 
    WHERE employee_id LIKE 'EMP-%' 
    ORDER BY CAST(SUBSTRING(employee_id, 5, LEN(employee_id)) AS INT) DESC
  `);
  
  if (result.recordset.length === 0) {
    return 'EMP-007';
  }
  
  const lastIdStr = result.recordset[0].employee_id;
  const lastNum = parseInt(lastIdStr.replace('EMP-', ''), 10);
  const nextNum = isNaN(lastNum) ? 7 : lastNum + 1;
  return 'EMP-' + String(nextNum).padStart(3, '0');
};


module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getUsers,
  updateUser,
  softDeleteUser,
  restoreUser,
  getNextEmployeeId,
};