const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// FIND USER BY EMAIL
// ============================================

const findUserByEmail = async (email) => {
  const result = await pool
    .request()
    .input(
      "email",
      sql.NVarChar(150),
      email
    )
    .query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.password_hash,
        u.status,
        u.is_deleted,
        r.role_name
      FROM users u

      INNER JOIN roles r
        ON u.role_id = r.id

      WHERE u.email = @email
      AND u.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// FIND USER BY ID
// ============================================

const findUserById = async (
  userId
) => {
  const result = await pool
    .request()
    .input(
      "userId",
      sql.Int,
      userId
    )
    .query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.employee_id,
        u.phone_number,
        u.profile_image,
        u.status,
        u.is_deleted,
        u.last_login,

        r.role_name,

        d.department_name

      FROM users u

      INNER JOIN roles r
        ON u.role_id = r.id

      LEFT JOIN departments d
        ON u.department_id = d.id

      WHERE u.id = @userId
      AND u.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// UPDATE LAST LOGIN
// ============================================

const updateLastLogin = async (
  userId
) => {
  await pool
    .request()
    .input(
      "userId",
      sql.Int,
      userId
    )
    .query(`
      UPDATE users
      SET
        last_login = GETDATE(),
        updated_at = GETDATE()
      WHERE id = @userId
    `);
};


// ============================================
// SAVE REFRESH TOKEN
// ============================================

const saveRefreshToken = async (
  userId,
  token,
  expiresAt
) => {
  await pool
    .request()
    .input(
      "userId",
      sql.Int,
      userId
    )
    .input(
      "token",
      sql.NVarChar(sql.MAX),
      token
    )
    .input(
      "expiresAt",
      sql.DateTime,
      expiresAt
    )
    .query(`
      INSERT INTO refresh_tokens
      (
        user_id,
        token,
        expires_at
      )
      VALUES
      (
        @userId,
        @token,
        @expiresAt
      )
    `);
};


// ============================================
// FIND REFRESH TOKEN
// ============================================

const findRefreshToken = async (
  token
) => {
  const result = await pool
    .request()
    .input(
      "token",
      sql.NVarChar(sql.MAX),
      token
    )
    .query(`
      SELECT *
      FROM refresh_tokens
      WHERE token = @token
      AND is_revoked = 0
      AND expires_at > GETDATE()
    `);

  return result.recordset[0];
};


// ============================================
// REVOKE REFRESH TOKEN
// ============================================

const revokeRefreshToken =
  async (token) => {
    await pool
      .request()
      .input(
        "token",
        sql.NVarChar(sql.MAX),
        token
      )
      .query(`
        UPDATE refresh_tokens
        SET
          is_revoked = 1,
          revoked_at = GETDATE()
        WHERE token = @token
      `);
  };


// ============================================
// REVOKE ALL USER TOKENS
// ============================================

const revokeAllUserTokens =
  async (userId) => {
    await pool
      .request()
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        UPDATE refresh_tokens
        SET
          is_revoked = 1,
          revoked_at = GETDATE()
        WHERE user_id = @userId
        AND is_revoked = 0
      `);
  };


// ============================================
// CREATE SESSION
// ============================================

const createSession = async ({
  userId,
  ipAddress,
  userAgent,
  deviceInfo = null,
}) => {
  await pool
    .request()
    .input(
      "userId",
      sql.Int,
      userId
    )
    .input(
      "ipAddress",
      sql.NVarChar(100),
      ipAddress
    )
    .input(
      "userAgent",
      sql.NVarChar(sql.MAX),
      userAgent
    )
    .input(
      "deviceInfo",
      sql.NVarChar(255),
      deviceInfo
    )
    .query(`
      INSERT INTO sessions
      (
        user_id,
        ip_address,
        user_agent,
        device_info
      )
      VALUES
      (
        @userId,
        @ipAddress,
        @userAgent,
        @deviceInfo
      )
    `);
};


// ============================================
// DEACTIVATE CURRENT SESSION
// ============================================

const deactivateSession =
  async (userId) => {
    await pool
      .request()
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        UPDATE sessions
        SET
          is_active = 0,
          logout_at = GETDATE()
        WHERE user_id = @userId
        AND is_active = 1
      `);
  };


// ============================================
// DEACTIVATE ALL SESSIONS
// ============================================

const deactivateAllSessions =
  async (userId) => {
    await pool
      .request()
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        UPDATE sessions
        SET
          is_active = 0,
          logout_at = GETDATE()
        WHERE user_id = @userId
      `);
  };


// ============================================
// CLEANUP EXPIRED TOKENS
// ============================================

const cleanupExpiredTokens =
  async () => {
    await pool
      .request()
      .query(`
        DELETE FROM refresh_tokens
        WHERE expires_at < GETDATE()
      `);
  };


// ============================================
// CLEANUP EXPIRED SESSIONS
// ============================================

const cleanupExpiredSessions =
  async () => {
    await pool
      .request()
      .query(`
        UPDATE sessions
        SET
          is_active = 0,
          logout_at = GETDATE()
        WHERE is_active = 1
        AND login_at < DATEADD(
          DAY,
          -7,
          GETDATE()
        )
      `);
  };


// ============================================
// EXPORTS
// ============================================

module.exports = {
  findUserByEmail,
  findUserById,

  updateLastLogin,

  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,

  createSession,
  deactivateSession,
  deactivateAllSessions,

  cleanupExpiredTokens,
  cleanupExpiredSessions,
};