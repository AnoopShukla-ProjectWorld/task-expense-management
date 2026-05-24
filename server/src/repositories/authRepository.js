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
    .input("email", sql.NVarChar(150), email)
    .query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.mobile_number,
        u.gender,
        u.date_of_birth,
        u.password_hash,
        u.status,
        u.role,
        u.email_verified,
        u.failed_login_attempts,
        u.account_locked_until,
        u.is_deleted
      FROM users u
      WHERE u.email = @email
      AND u.is_deleted = 0
    `);

  return result.recordset[0];
};


// ============================================
// FIND USER BY EMAIL OR MOBILE
// ============================================

const findUserByEmailOrMobile = async (emailOrMobile) => {
  const result = await pool
    .request()
    .input("emailOrMobile", sql.NVarChar(150), emailOrMobile)
    .query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.mobile_number,
        u.gender,
        u.date_of_birth,
        u.password_hash,
        u.status,
        u.role,
        u.email_verified,
        u.failed_login_attempts,
        u.account_locked_until,
        u.is_deleted
      FROM users u
      WHERE (u.email = @emailOrMobile OR u.mobile_number = @emailOrMobile)
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
        u.last_login,
        d.department_name
      FROM users u
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

const updateLastLogin = async (userId) => {
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE users
      SET
        last_login = GETDATE(),
        failed_login_attempts = 0,
        account_locked_until = NULL,
        updated_at = GETDATE()
      WHERE id = @userId
    `);
};


// ============================================
// INCREMENT FAILED LOGIN ATTEMPTS
// ============================================

const incrementFailedLoginAttempts = async (emailOrMobile) => {
  await pool
    .request()
    .input("emailOrMobile", sql.NVarChar(150), emailOrMobile)
    .query(`
      UPDATE users
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        updated_at = GETDATE()
      WHERE (email = @emailOrMobile OR mobile_number = @emailOrMobile)
    `);
};


// ============================================
// LOCK USER ACCOUNT
// ============================================

const lockAccount = async (emailOrMobile, lockMinutes = 15) => {
  await pool
    .request()
    .input("emailOrMobile", sql.NVarChar(150), emailOrMobile)
    .input("lockMinutes", sql.Int, lockMinutes)
    .query(`
      UPDATE users
      SET 
        account_locked_until = DATEADD(minute, @lockMinutes, GETDATE()),
        updated_at = GETDATE()
      WHERE (email = @emailOrMobile OR mobile_number = @emailOrMobile)
    `);
};


// ============================================
// RESET FAILED LOGIN ATTEMPTS
// ============================================

const resetFailedLoginAttempts = async (emailOrMobile) => {
  await pool
    .request()
    .input("emailOrMobile", sql.NVarChar(150), emailOrMobile)
    .query(`
      UPDATE users
      SET 
        failed_login_attempts = 0,
        account_locked_until = NULL,
        updated_at = GETDATE()
      WHERE (email = @emailOrMobile OR mobile_number = @emailOrMobile)
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
    .input("now", sql.DateTime, new Date())
    .query(`
      SELECT *
      FROM refresh_tokens
      WHERE token = @token
      AND is_revoked = 0
      AND expires_at > @now
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
// OTP VERIFICATION HELPERS
// ============================================

const saveOtpVerification = async (email, otpHash, expiresAt) => {
  await pool
    .request()
    .input("email", sql.NVarChar(150), email)
    .input("otpHash", sql.NVarChar(255), otpHash)
    .input("expiresAt", sql.DateTime, expiresAt)
    .query(`
      MERGE INTO otp_verifications AS target
      USING (SELECT @email AS email) AS source
      ON target.email = source.email
      WHEN MATCHED THEN
        UPDATE SET 
          otp_hash = @otpHash, 
          expires_at = @expiresAt, 
          attempts = 0, 
          resend_attempts = resend_attempts + 1,
          last_requested_at = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (email, otp_hash, expires_at, attempts, resend_attempts, last_requested_at)
        VALUES (@email, @otpHash, @expiresAt, 0, 0, GETDATE());
    `);
};

const findOtpVerification = async (email) => {
  const result = await pool
    .request()
    .input("email", sql.NVarChar(150), email)
    .query(`
      SELECT *
      FROM otp_verifications
      WHERE email = @email
    `);
  return result.recordset[0];
};

const incrementOtpAttempts = async (email) => {
  await pool
    .request()
    .input("email", sql.NVarChar(150), email)
    .query(`
      UPDATE otp_verifications
      SET attempts = attempts + 1
      WHERE email = @email
    `);
};

const invalidateOtp = async (email) => {
  await pool
    .request()
    .input("email", sql.NVarChar(150), email)
    .query(`
      DELETE FROM otp_verifications
      WHERE email = @email
    `);
};


// ============================================
// PASSWORD RESET TOKENS HELPERS
// ============================================

const savePasswordResetToken = async (userId, tokenHash, expiresAt) => {
  // Invalidate previous active tokens for this user first
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE password_reset_tokens
      SET is_used = 1
      WHERE user_id = @userId
      AND is_used = 0
    `);

  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("tokenHash", sql.NVarChar(255), tokenHash)
    .input("expiresAt", sql.DateTime, expiresAt)
    .query(`
      INSERT INTO password_reset_tokens
      (user_id, token_hash, expires_at)
      VALUES
      (@userId, @tokenHash, @expiresAt)
    `);
};

const findPasswordResetToken = async (tokenHash) => {
  const result = await pool
    .request()
    .input("tokenHash", sql.NVarChar(255), tokenHash)
    .input("now", sql.DateTime, new Date())
    .query(`
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = @tokenHash
      AND is_used = 0
      AND expires_at > @now
    `);
  return result.recordset[0];
};

const usePasswordResetToken = async (tokenHash) => {
  await pool
    .request()
    .input("tokenHash", sql.NVarChar(255), tokenHash)
    .query(`
      UPDATE password_reset_tokens
      SET is_used = 1
      WHERE token_hash = @tokenHash
    `);
};


// ============================================
// EXPORTS
// ============================================

module.exports = {
  findUserByEmail,
  findUserByEmailOrMobile,
  findUserById,

  updateLastLogin,
  incrementFailedLoginAttempts,
  lockAccount,
  resetFailedLoginAttempts,

  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,

  createSession,
  deactivateSession,
  deactivateAllSessions,

  cleanupExpiredTokens,
  cleanupExpiredSessions,

  saveOtpVerification,
  findOtpVerification,
  incrementOtpAttempts,
  invalidateOtp,

  savePasswordResetToken,
  findPasswordResetToken,
  usePasswordResetToken,
};