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
  getAdminDashboard,
  taskAnalytics,
  expenseAnalytics,
  projectAnalytics,
  userProductivity,
  exportCSV,
  exportExcel,
} = require(
  "../controllers/reportController"
);


// ============================================
// ADMIN DASHBOARD
// ============================================

router.get(
  "/dashboard/admin",
  authMiddleware,
  roleMiddleware(
    "ADMIN"
  ),
  getAdminDashboard
);


// ============================================
// TASK ANALYTICS
// ============================================

router.get(
  "/tasks",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  taskAnalytics
);


// ============================================
// EXPENSE ANALYTICS
// ============================================

router.get(
  "/expenses",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  expenseAnalytics
);


// ============================================
// PROJECT ANALYTICS
// ============================================

router.get(
  "/projects",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  projectAnalytics
);


// ============================================
// PRODUCTIVITY REPORT
// ============================================

router.get(
  "/productivity",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  userProductivity
);


// ============================================
// EXPORT CSV
// ============================================

router.get(
  "/export/csv",
  authMiddleware,
  roleMiddleware(
    "ADMIN"
  ),
  exportCSV
);


// ============================================
// EXPORT EXCEL
// ============================================

router.get(
  "/export/excel",
  authMiddleware,
  roleMiddleware(
    "ADMIN"
  ),
  exportExcel
);


module.exports = router;