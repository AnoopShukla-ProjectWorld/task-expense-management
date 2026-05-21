const express = require("express");

const router =
  express.Router();

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const roleMiddleware = require(
  "../middlewares/roleMiddleware"
);

const {
  getAuditLogs,
} = require(
  "../controllers/auditController"
);


// ============================================
// ADMIN ONLY
// ============================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAuditLogs
);


module.exports = router;