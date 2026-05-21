const express = require("express");

const router = express.Router();

const {
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  getMe,
} = require(
  "../controllers/authController"
);

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const validateMiddleware = require(
  "../middlewares/validateMiddleware"
);

const {
  loginValidation,
} = require(
  "../validations/authValidation"
);

const {
  authLimiter,
} = require(
  "../config/rateLimiter"
);


// ============================================
// AUTH ROUTES
// ============================================

// LOGIN
router.post(
  "/login",
  authLimiter,
  loginValidation,
  validateMiddleware,
  login
);

// REFRESH TOKEN
router.post(
  "/refresh-token",
  refreshToken
);

// LOGOUT
router.post(
  "/logout",
  authMiddleware,
  logout
);

// LOGOUT ALL DEVICES
router.post(
  "/logout-all",
  authMiddleware,
  logoutAllDevices
);

// GET CURRENT USER
router.get(
  "/me",
  authMiddleware,
  getMe
);

module.exports = router;