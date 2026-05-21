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


// ============================================
// AUTH RATE LIMITER
// ============================================

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


module.exports = {
  globalLimiter,
  authLimiter,
};