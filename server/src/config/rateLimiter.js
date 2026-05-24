const rateLimit = require(
  "express-rate-limit"
);


// ============================================
// GLOBAL RATE LIMITER
// ============================================

const globalLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 500,

    message: {
      success: false,
      message:
        "Too many requests",
    },

    standardHeaders: true,

    legacyHeaders: false,
  });


const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    message: {
      success: false,
      message:
        "Too many login attempts",
    },
  });


// ============================================
// ADMIN AUTH RATE LIMITER
// ============================================

const adminAuthLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000, // 10 minutes

    max: 3, // 3 attempts

    message: {
      success: false,
      message:
        "Too many admin login attempts. Access blocked for 10 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });


module.exports = {
  globalLimiter,
  authLimiter,
  adminAuthLimiter,
};