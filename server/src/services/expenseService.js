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
  updateExpense,
  deleteExpenseAttachments,
} = require(
  "../repositories/expenseRepository"
);

const {
  createAuditLog,
} = require("../repositories/auditRepository");

const {
  expenseApprovedEvent,
  expenseRejectedEvent,
  expenseCreatedEvent,
  expenseManagerApprovedEvent,
} = require(
  "../events/notificationEvents"
);

const { findProjectById } = require("../repositories/projectRepository");

// ============================================
// CREATE EXPENSE SERVICE
// ============================================

const { findUserById, getUsers } = require("../repositories/userRepository");

const createExpenseService =
  async ({
    userId,
    body,
    file,
    ipAddress,
  }) => {
    const user = await findUserById(userId);
    const userRole = user ? user.role : "employee";

    let status = "PENDING";
    let managerApproval = "PENDING";

    if (userRole === "admin") {
      status = "APPROVED";
      managerApproval = "APPROVED";
    } else if (userRole === "manager") {
      status = "PENDING";
      managerApproval = "APPROVED"; // Managers bypass manager review
    } else {
      // Employee
      if (!body.project_id && !body.assigned_manager_id) {
        status = "PENDING";
        managerApproval = "APPROVED"; // General expenses with no manager bypass manager review
      } else {
        status = "PENDING";
        managerApproval = "PENDING"; // Must be reviewed by Project Manager/Chosen Manager first
      }
    }

    const expense =
      await createExpense({
        userId,
        projectId:
          body.project_id || null,
        assignedManagerId:
          body.assigned_manager_id || null,
        amount: body.amount,
        category: body.category,
        description:
          body.description,
        expenseDate:
          body.expense_date,
        managerApproval,
        status,
        taskId: body.task_id || null,
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

    // Trigger notification for expense request submission
    if (status === "PENDING") {
      let projectName = "";
      let managerId = null;

      if (body.project_id) {
        const project = await findProjectById(body.project_id);
        if (project) {
          projectName = project.project_name;
          managerId = project.assigned_manager_id;
        }
      }

      if (!managerId && body.assigned_manager_id) {
        managerId = parseInt(body.assigned_manager_id);
      }

      if (managerId) {
        // Notify the manager
        await expenseCreatedEvent({
          userId: managerId,
          amount: body.amount,
          employeeName: user?.full_name || "An employee",
          projectName,
        });
      } else {
        // Notify all admins (for general expenses reviewed by admin)
        const admins = await getUsers({ role: "admin" });
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await expenseCreatedEvent({
              userId: admin.id,
              amount: body.amount,
              employeeName: user?.full_name || "An employee",
              projectName: "",
            });
          }
        }
      }
    }

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

    const reviewer = await findUserById(reviewedBy);
    const reviewerRole = reviewer ? reviewer.role : "employee";

    if (reviewerRole === "manager") {
      if (expense.manager_approval !== "PENDING") {
        throw new AppError(
          "Expense already reviewed by manager",
          400
        );
      }

      if (status === "APPROVED") {
        // Manager approves: sets manager_approval to APPROVED, but status remains PENDING for Admin final review!
        await updateExpenseStatus({
          expenseId,
          managerApproval: "APPROVED",
          managerApprovedBy: reviewedBy,
        });

        // Notify Admins that manager has approved this claim and it awaits final Admin decision
        const admins = await getUsers({ role: "admin" });
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await expenseManagerApprovedEvent({
              userId: admin.id,
              amount: expense.amount,
              employeeName: expense.employee_name || "Employee",
              managerName: reviewer?.full_name || "Manager",
            });
          }
        }
      } else {
        // Manager rejects: sets both status and manager_approval to REJECTED
        await updateExpenseStatus({
          expenseId,
          status: "REJECTED",
          managerApproval: "REJECTED",
          managerApprovedBy: reviewedBy,
          rejectionReason,
          reviewedBy,
        });
      }
    } else if (reviewerRole === "admin") {
      // Admin approves or rejects finally
      if (status === "APPROVED") {
        await updateExpenseStatus({
          expenseId,
          status: "APPROVED",
          reviewedBy,
        });
      } else {
        await updateExpenseStatus({
          expenseId,
          status: "REJECTED",
          reviewedBy,
          rejectionReason,
        });
      }
    } else {
      throw new AppError("Unauthorized to review expense", 403);
    }

    if (status === "APPROVED" && reviewerRole === "admin") {
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

// ============================================
// UPDATE EXPENSE SERVICE
// ============================================
const updateExpenseService = async ({
  expenseId,
  userId,
  body,
  file,
  ipAddress,
}) => {
  const expense = await findExpenseById(expenseId);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  if (expense.user_id !== userId) {
    throw new AppError("Unauthorized to update this expense", 403);
  }

  if (expense.status !== "PENDING" || expense.manager_approval !== "PENDING") {
    throw new AppError("Only pending claims can be updated", 400);
  }

  const updatedExpense = await updateExpense(expenseId, {
    projectId: body.project_id || null,
    assignedManagerId: body.assigned_manager_id || null,
    amount: body.amount,
    category: body.category,
    description: body.description,
    expenseDate: body.expense_date,
    taskId: body.task_id || null,
  });

  if (file) {
    await deleteExpenseAttachments(expenseId);
    await saveExpenseAttachment({
      expenseId,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  await createAuditLog({
    user_id: userId,
    action: "UPDATE_EXPENSE",
    entity_name: "expenses",
    entity_id: expenseId,
    old_values: expense,
    new_values: updatedExpense,
    ip_address: ipAddress,
  });

  return updatedExpense;
};

module.exports = {
  createExpenseService,
  updateExpenseStatusService,
  getExpenses,
  softDeleteExpense,
  updateExpenseService,
};