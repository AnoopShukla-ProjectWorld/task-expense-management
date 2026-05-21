const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require(
  "../utils/apiResponse"
);

const {
  getAdminDashboardService,
  getTaskAnalyticsService,
  getExpenseAnalyticsService,
  getProjectAnalyticsService,
  getUserProductivityService,
} = require(
  "../services/reportService"
);

const {
  exportToCSV,
} = require(
  "../utils/csvExporter"
);

const {
  exportToExcel,
} = require(
  "../utils/excelExporter"
);


// ============================================
// ADMIN DASHBOARD
// ============================================

const getAdminDashboard =
  asyncHandler(
    async (req, res) => {
      const data =
        await getAdminDashboardService();

      return successResponse(
        res,
        200,
        "Dashboard stats fetched",
        data
      );
    }
  );


// ============================================
// TASK ANALYTICS
// ============================================

const taskAnalytics =
  asyncHandler(
    async (req, res) => {
      const data =
        await getTaskAnalyticsService(
          req.query
        );

      return successResponse(
        res,
        200,
        "Task analytics fetched",
        data
      );
    }
  );


// ============================================
// EXPENSE ANALYTICS
// ============================================

const expenseAnalytics =
  asyncHandler(
    async (req, res) => {
      const data =
        await getExpenseAnalyticsService(
          req.query
        );

      return successResponse(
        res,
        200,
        "Expense analytics fetched",
        data
      );
    }
  );


// ============================================
// PROJECT ANALYTICS
// ============================================

const projectAnalytics =
  asyncHandler(
    async (req, res) => {
      const data =
        await getProjectAnalyticsService();

      return successResponse(
        res,
        200,
        "Project analytics fetched",
        data
      );
    }
  );


// ============================================
// USER PRODUCTIVITY
// ============================================

const userProductivity =
  asyncHandler(
    async (req, res) => {
      const data =
        await getUserProductivityService();

      return successResponse(
        res,
        200,
        "User productivity fetched",
        data
      );
    }
  );


// ============================================
// EXPORT CSV
// ============================================

const exportCSV =
  asyncHandler(
    async (req, res) => {
      const data =
        await getUserProductivityService();

      const csv =
        exportToCSV(data);

      res.header(
        "Content-Type",
        "text/csv"
      );

      res.attachment(
        "report.csv"
      );

      return res.send(csv);
    }
  );


// ============================================
// EXPORT EXCEL
// ============================================

const exportExcel =
  asyncHandler(
    async (req, res) => {
      const data =
        await getUserProductivityService();

      const workbook =
        await exportToExcel(
          data,
          "Report"
        );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=report.xlsx"
      );

      await workbook.xlsx.write(
        res
      );

      res.end();
    }
  );


module.exports = {
  getAdminDashboard,
  taskAnalytics,
  expenseAnalytics,
  projectAnalytics,
  userProductivity,
  exportCSV,
  exportExcel,
};