const express = require("express");
const router = express.Router();
const {
  getCaptcha,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendMobileOtp,
  verifyMobileOtp,
  register,
  login,
  secureAdminLogin,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  verifyCaptchaEndpoint,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authLimiter, adminAuthLimiter } = require("../config/rateLimiter");

// 1. CAPTCHA
router.get("/captcha", getCaptcha);
router.post("/verify-captcha", verifyCaptchaEndpoint);

// 2. REGISTRATION FLOW
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);
router.post("/register", register);

// 3. UNIFIED LOGIN (Employee/Manager)
router.post("/login", authLimiter, login);

// 4. SECRET ADMIN LOGIN (Secret Passphrase + Rate Limiter)
router.post("/secure-admin-login", adminAuthLimiter, secureAdminLogin);

// 5. REFRESH TOKEN
router.post("/refresh-token", refreshToken);

// 6. FORGOT & RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// 7. SESSIONS
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;