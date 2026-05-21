const bcrypt = require("bcrypt");

const AppError = require("../utils/AppError");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const {
  findUserByEmail,
  saveRefreshToken,
  createSession,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  deactivateSession,
  deactivateAllSessions,
} = require("../repositories/authRepository");

const {
  createAuditLog,
} = require(
  "../repositories/auditRepository"
);


// ============================================
// LOGIN SERVICE
// ============================================

const loginService = async ({
  email,
  password,
  ipAddress,
  userAgent,
}) => {
  const user = await findUserByEmail(email);

  // ============================================
  // INVALID USER
  // ============================================

  if (!user) {
    await createAuditLog({
      action: "FAILED_LOGIN",
      entity_name: "auth",
      ip_address: ipAddress,
      new_values: {
        email,
        reason: "User not found",
      },
    });

    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!isPasswordValid) {
    await createAuditLog({
      user_id: user.id,
      action: "FAILED_LOGIN",
      entity_name: "auth",
      entity_id: user.id,
      ip_address: ipAddress,
      new_values: {
        email,
        reason: "Invalid password",
      },
    });

    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  // ============================================
  // ACCOUNT STATUS
  // ============================================

  if (user.status !== "ACTIVE") {
    await createAuditLog({
      user_id: user.id,
      action: "BLOCKED_LOGIN",
      entity_name: "auth",
      entity_id: user.id,
      ip_address: ipAddress,
      new_values: {
        status: user.status,
      },
    });

    throw new AppError(
      "Account inactive",
      403
    );
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role_name,
  };

  const accessToken =
    generateAccessToken(payload);

  const refreshToken =
    generateRefreshToken(payload);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + 7
  );

  // ============================================
  // SAVE REFRESH TOKEN
  // ============================================

  await saveRefreshToken(
    user.id,
    refreshToken,
    expiresAt
  );

  // ============================================
  // CREATE SESSION
  // ============================================

  await createSession({
    userId: user.id,
    ipAddress,
    userAgent,
  });

  // ============================================
  // LOGIN AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: user.id,
    action: "LOGIN",
    entity_name: "auth",
    entity_id: user.id,
    ip_address: ipAddress,
  });

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role_name,
    },

    accessToken,
    refreshToken,
  };
};


// ============================================
// REFRESH TOKEN SERVICE
// ============================================

const refreshTokenService = async (
  refreshToken,
  ipAddress = null
) => {
  if (!refreshToken) {
    throw new AppError(
      "Refresh token missing",
      401
    );
  }

  const storedToken =
    await findRefreshToken(
      refreshToken
    );

  if (!storedToken) {
    throw new AppError(
      "Invalid refresh token",
      401
    );
  }

  let decoded;

  try {
    decoded =
      verifyRefreshToken(
        refreshToken
      );
  } catch (error) {
    throw new AppError(
      "Expired refresh token",
      401
    );
  }

  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };

  const newAccessToken =
    generateAccessToken(payload);

  const newRefreshToken =
    generateRefreshToken(payload);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + 7
  );

  // ============================================
  // TOKEN ROTATION
  // ============================================

  await revokeRefreshToken(
    refreshToken
  );

  await saveRefreshToken(
    decoded.id,
    newRefreshToken,
    expiresAt
  );

  // ============================================
  // AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: decoded.id,
    action: "REFRESH_TOKEN",
    entity_name: "auth",
    entity_id: decoded.id,
    ip_address: ipAddress,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};


// ============================================
// LOGOUT SERVICE
// ============================================

const logoutService = async (
  userId,
  refreshToken,
  ipAddress = null
) => {
  if (refreshToken) {
    await revokeRefreshToken(
      refreshToken
    );
  }

  await deactivateSession(
    userId
  );

  // ============================================
  // AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: userId,
    action: "LOGOUT",
    entity_name: "auth",
    entity_id: userId,
    ip_address: ipAddress,
  });
};


// ============================================
// LOGOUT ALL DEVICES SERVICE
// ============================================

const logoutAllDevicesService =
  async (
    userId,
    ipAddress = null
  ) => {
    await revokeAllUserTokens(
      userId
    );

    await deactivateAllSessions(
      userId
    );

    // ============================================
    // AUDIT LOG
    // ============================================

    await createAuditLog({
      user_id: userId,
      action: "LOGOUT_ALL_DEVICES",
      entity_name: "auth",
      entity_id: userId,
      ip_address: ipAddress,
    });
  };


// ============================================
// EXPORTS
// ============================================

module.exports = {
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllDevicesService,
};