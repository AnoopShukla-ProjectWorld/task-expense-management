const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require("../utils/apiResponse");

const {
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllDevicesService,
} = require("../services/authService");

const cookieOptions = require(
  "../config/cookieConfig"
);


// ============================================
// LOGIN
// ============================================

const login = asyncHandler(
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    const result =
      await loginService({
        email,
        password,
        ipAddress: req.ip,
        userAgent:
          req.headers["user-agent"],
      });

    // Access Token Cookie
    res.cookie(
      "accessToken",
      result.accessToken,
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      }
    );

    // Refresh Token Cookie
    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        ...cookieOptions,
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    return successResponse(
      res,
      200,
      "Login successful",
      {
        user: result.user,
      }
    );
  }
);


// ============================================
// REFRESH TOKEN
// ============================================

const refreshToken =
  asyncHandler(
    async (req, res) => {
      const refreshToken =
        req.cookies.refreshToken;

      const result =
        await refreshTokenService(
          refreshToken
        );

      // New Access Token
      res.cookie(
        "accessToken",
        result.accessToken,
        {
          ...cookieOptions,
          maxAge:
            15 *
            60 *
            1000,
        }
      );

      // Rotated Refresh Token
      res.cookie(
        "refreshToken",
        result.refreshToken,
        {
          ...cookieOptions,
          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        }
      );

      return successResponse(
        res,
        200,
        "Token refreshed successfully"
      );
    }
  );


// ============================================
// LOGOUT
// ============================================

const logout = asyncHandler(
  async (req, res) => {
    const refreshToken =
      req.cookies.refreshToken;

    await logoutService(
      req.user?.id,
      refreshToken
    );

    res.clearCookie(
      "accessToken",
      cookieOptions
    );

    res.clearCookie(
      "refreshToken",
      cookieOptions
    );

    return successResponse(
      res,
      200,
      "Logout successful"
    );
  }
);

// ============================================
// LOGOUT ALL DEVICES
// ============================================

const logoutAllDevices =
  asyncHandler(
    async (req, res) => {
      await logoutAllDevicesService(
        req.user.id
      );

      res.clearCookie(
        "accessToken",
        cookieOptions
      );

      res.clearCookie(
        "refreshToken",
        cookieOptions
      );

      return successResponse(
        res,
        200,
        "Logged out from all devices"
      );
    }
  );


// ============================================
// GET AUTHENTICATED USER
// ============================================

const getMe = asyncHandler(
  async (req, res) => {
    return successResponse(
      res,
      200,
      "Authenticated user fetched successfully",
      {
        user: req.user,
      }
    );
  }
);


// ============================================
// EXPORTS
// ============================================

module.exports = {
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  getMe,
};