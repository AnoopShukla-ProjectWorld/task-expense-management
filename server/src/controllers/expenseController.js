const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require(
  "../utils/apiResponse"
);

const {
  createExpenseService,
  updateExpenseStatusService,
  getExpenses,
  softDeleteExpense,
  updateExpenseService,
} = require(
  "../services/expenseService"
);


// ============================================
// CREATE EXPENSE
// ============================================

const createExpense =
  asyncHandler(
    async (req, res) => {
      const expense =
        await createExpenseService(
          {
            userId:
              req.user.id,
            body: req.body,
            file: req.file,
          }
        );

      return successResponse(
        res,
        201,
        "Expense created successfully",
        expense
      );
    }
  );


// ============================================
// GET EXPENSES
// ============================================

const getAllExpenses =
  asyncHandler(
    async (req, res) => {
      const expenses =
        await getExpenses({
          page:
            Number(
              req.query.page
            ) || 1,

          limit:
            Number(
              req.query.limit
            ) || 10,

          status:
            req.query.status,

          category:
            req.query.category,
          userId: req.user.id,
          userRole: req.user.role,
          my: req.query.my === "true",
        });

      return successResponse(
        res,
        200,
        "Expenses fetched successfully",
        expenses
      );
    }
  );


// ============================================
// APPROVE / REJECT
// ============================================

const reviewExpense =
  asyncHandler(
    async (req, res) => {
      await updateExpenseStatusService(
        {
          expenseId:
            req.params.id,

          status:
            req.body.status,

          reviewedBy:
            req.user.id,

          rejectionReason:
            req.body
              .rejection_reason,
        }
      );

      return successResponse(
        res,
        200,
        "Expense reviewed successfully"
      );
    }
  );


// ============================================
// DELETE EXPENSE
// ============================================

const deleteExpense =
  asyncHandler(
    async (req, res) => {
      await softDeleteExpense(
        req.params.id
      );

      return successResponse(
        res,
        200,
        "Expense deleted successfully"
      );
    }
  );

// ============================================
// UPDATE EXPENSE
// ============================================
const updateExpense =
  asyncHandler(
    async (req, res) => {
      const expense =
        await updateExpenseService(
          {
            expenseId: req.params.id,
            userId: req.user.id,
            body: req.body,
            file: req.file,
          }
        );

      return successResponse(
        res,
        200,
        "Expense updated successfully",
        expense
      );
    }
  );

module.exports = {
  createExpense,
  getAllExpenses,
  reviewExpense,
  deleteExpense,
  updateExpense,
};