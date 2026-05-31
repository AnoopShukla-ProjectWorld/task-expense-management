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
        await getUserProductivityService(req.query);

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
        await getUserProductivityService(req.query);

      const formattedData = data.map(item => {
        const total = Number(item.total_tasks) || 0;
        const completed = Number(item.completed_tasks) || 0;
        const pending = Number(item.pending_tasks) || 0;
        const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          "Employee ID": item.employee_id || "N/A",
          "Staff Member Name": item.full_name,
          "Corporate Email": item.email,
          "Department": item.department_name || "General / Unassigned",
          "Total Allocated Tasks": total,
          "Completed Tasks": completed,
          "Pending Tasks": pending,
          "Completion Ratio (%)": `${ratio}%`
        };
      });

      const csv =
        exportToCSV(formattedData);

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
        await getUserProductivityService(req.query);

      const formattedData = data.map(item => {
        const total = Number(item.total_tasks) || 0;
        const completed = Number(item.completed_tasks) || 0;
        const pending = Number(item.pending_tasks) || 0;
        const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          "Employee ID": item.employee_id || "N/A",
          "Staff Member Name": item.full_name,
          "Corporate Email": item.email,
          "Department": item.department_name || "General / Unassigned",
          "Total Allocated Tasks": total,
          "Completed Tasks": completed,
          "Pending Tasks": pending,
          "Completion Ratio (%)": `${ratio}%`
        };
      });

      const workbook =
        await exportToExcel(
          formattedData,
          "Staff Productivity"
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