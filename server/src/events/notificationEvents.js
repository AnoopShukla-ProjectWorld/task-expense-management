const {
  sendNotification,
} = require(
  "../services/notificationService"
);


// ============================================
// TASK ASSIGNED EVENT
// ============================================

const taskAssignedEvent =
  async ({
    userId,
    taskTitle,
  }) => {
    await sendNotification({
      userId,

      title:
        "New Task Assigned",

      message: `You have been assigned task: ${taskTitle}`,

      type: "TASK",
    });
  };


// ============================================
// EXPENSE APPROVED EVENT
// ============================================

const expenseApprovedEvent =
  async ({
    userId,
    amount,
  }) => {
    await sendNotification({
      userId,

      title:
        "Expense Approved",

      message: `Your expense of ₹${amount} has been approved.`,

      type: "EXPENSE",
    });
  };


// ============================================
// EXPENSE REJECTED EVENT
// ============================================

const expenseRejectedEvent =
  async ({
    userId,
    amount,
  }) => {
    await sendNotification({
      userId,

      title:
        "Expense Rejected",

      message: `Your expense of ₹${amount} has been rejected.`,

      type: "EXPENSE",
    });
  };


// ============================================
// PROJECT ASSIGNED EVENT
// ============================================

const projectAssignedEvent =
  async ({
    userId,
    projectName,
  }) => {
    await sendNotification({
      userId,

      title:
        "New Project Assigned",

      message: `You have been assigned project: ${projectName}`,

      type: "PROJECT",
    });
  };

module.exports = {
  taskAssignedEvent,
  expenseApprovedEvent,
  expenseRejectedEvent,
  projectAssignedEvent,
};