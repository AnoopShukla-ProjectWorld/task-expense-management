const AppError = require(
  "../utils/AppError"
);

const {
  createExpense,
  saveExpenseAttachment,
  findExpenseById,
  updateExpenseStatus,
  getExpenses,
  softDeleteExpense,
} = require(
  "../repositories/expenseRepository"
);

const {
  createAuditLog,
} = require("../repositories/auditRepository");

const {
  expenseApprovedEvent,
  expenseRejectedEvent,
} = require(
  "../events/notificationEvents"
);


// ============================================
// CREATE EXPENSE SERVICE
// ============================================

const createExpenseService =
  async ({
    userId,
    body,
    file,
    ipAddress,
  }) => {
    const expense =
      await createExpense({
        userId,
        projectId:
          body.project_id || null,
        amount: body.amount,
        category: body.category,
        description:
          body.description,
        expenseDate:
          body.expense_date,
      });

    if (file) {
      await saveExpenseAttachment({
        expenseId: expense.id,
        fileName:
          file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType:
          file.mimetype,
      });
    }

    await createAuditLog({
      user_id: userId,
      action: "CREATE_EXPENSE",
      entity_name: "expenses",
      entity_id: expense.id,
      new_values: expense,
      ip_address: ipAddress,
    });

    return expense;
  };


// ============================================
// APPROVE / REJECT
// ============================================

const updateExpenseStatusService =
  async ({
    expenseId,
    status,
    reviewedBy,
    rejectionReason,
    ipAddress,
  }) => {
    const expense =
      await findExpenseById(
        expenseId
      );

    if (!expense) {
      throw new AppError(
        "Expense not found",
        404
      );
    }

    if (
      expense.status !==
      "PENDING"
    ) {
      throw new AppError(
        "Expense already reviewed",
        400
      );
    }

    await updateExpenseStatus({
      expenseId,
      status,
      reviewedBy,
      rejectionReason,
    });

    if (status === "APPROVED") {
      await expenseApprovedEvent({
        userId: expense.user_id,
        amount: expense.amount,
      });
    }

    if (status === "REJECTED") {
      await expenseRejectedEvent({
        userId: expense.user_id,
        amount: expense.amount,
      });
    }

    await createAuditLog({
      user_id: reviewedBy,
      action: `EXPENSE_${status}`,
      entity_name: "expenses",
      entity_id: expenseId,
      old_values: expense,
      new_values: {
        status,
        rejectionReason,
      },
      ip_address: ipAddress,
    });
  };

module.exports = {
  createExpenseService,
  updateExpenseStatusService,
  getExpenses,
  softDeleteExpense,
};