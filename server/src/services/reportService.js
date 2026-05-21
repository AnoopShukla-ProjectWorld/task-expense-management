const {
  getAdminDashboardStats,
  getTaskAnalytics,
  getExpenseAnalytics,
  getProjectAnalytics,
  getUserProductivity,
} = require(
  "../repositories/reportRepository"
);


// ============================================
// ADMIN DASHBOARD
// ============================================

const getAdminDashboardService =
  async () => {
    return await getAdminDashboardStats();
  };


// ============================================
// TASK ANALYTICS
// ============================================

const getTaskAnalyticsService =
  async (filters) => {
    return await getTaskAnalytics(
      filters
    );
  };


// ============================================
// EXPENSE ANALYTICS
// ============================================

const getExpenseAnalyticsService =
  async (filters) => {
    return await getExpenseAnalytics(
      filters
    );
  };


// ============================================
// PROJECT ANALYTICS
// ============================================

const getProjectAnalyticsService =
  async () => {
    return await getProjectAnalytics();
  };


// ============================================
// USER PRODUCTIVITY
// ============================================

const getUserProductivityService =
  async () => {
    return await getUserProductivity();
  };


module.exports = {
  getAdminDashboardService,
  getTaskAnalyticsService,
  getExpenseAnalyticsService,
  getProjectAnalyticsService,
  getUserProductivityService,
};