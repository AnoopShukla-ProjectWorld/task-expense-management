const AppError = require("../utils/AppError");

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  FORBIDDEN,
  UNAUTHORIZED,
} = require("../constants/httpStatus");

const roleMiddleware = (...allowedRoles) => {
  return asyncHandler(
    async (req, res, next) => {
      if (!req.user) {
        throw new AppError(
          "Authentication required",
          UNAUTHORIZED
        );
      }

      if (
        !allowedRoles.includes(
          req.user.role
        )
      ) {
        throw new AppError(
          "Access denied",
          FORBIDDEN
        );
      }

      next();
    }
  );
};

module.exports = roleMiddleware;