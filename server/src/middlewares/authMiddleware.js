const jwt = require("jsonwebtoken");

const asyncHandler = require(
  "../utils/asyncHandler"
);

const AppError = require(
  "../utils/AppError"
);

const env = require("../config/env");

const {
  findUserById,
} = require(
  "../repositories/authRepository"
);

const {
  UNAUTHORIZED,
  FORBIDDEN,
} = require("../constants/httpStatus");

const authMiddleware = asyncHandler(
  async (req, res, next) => {
    let token;

    // ============================================
    // GET ACCESS TOKEN FROM COOKIES
    // ============================================

    if (
      req.cookies &&
      req.cookies.accessToken
    ) {
      token = req.cookies.accessToken;
    }

    // ============================================
    // TOKEN NOT FOUND
    // ============================================

    if (!token) {
      throw new AppError(
        "Unauthorized access",
        UNAUTHORIZED
      );
    }

    try {
      // ============================================
      // VERIFY JWT TOKEN
      // ============================================

      const decoded = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET
      );

      // ============================================
      // FIND USER
      // ============================================

      const user =
        await findUserById(
          decoded.id
        );

      if (!user) {
        throw new AppError(
          "User no longer exists",
          UNAUTHORIZED
        );
      }

      // ============================================
      // CHECK SOFT DELETE
      // ============================================

      if (user.is_deleted) {
        throw new AppError(
          "Account deleted",
          UNAUTHORIZED
        );
      }

      // ============================================
      // CHECK ACCOUNT STATUS
      // ============================================

      if (
        user.status !== "ACTIVE"
      ) {
        throw new AppError(
          "Account inactive",
          FORBIDDEN
        );
      }

      // ============================================
      // ATTACH USER TO REQUEST
      // ============================================

      req.user = {
        id: user.id,
        fullName:
          user.full_name,
        email: user.email,
        role: user.role_name,
        department:
          user.department_name,
      };

      next();
    } catch (error) {
      throw new AppError(
        "Invalid or expired token",
        UNAUTHORIZED
      );
    }
  }
);

module.exports = authMiddleware;