const AppError = require("../utils/AppError");

const {
  createTask,
  findTaskById,
  getTasks,
  updateTask,
  deleteTask,
  restoreTask,
  addTaskComment,
  getTaskComments,
  getOverdueTasks,
} = require(
  "../repositories/taskRepository"
);

const {
  createAuditLog,
} = require(
  "../repositories/auditRepository"
);

const {
  taskAssignedEvent,
} = require(
  "../events/notificationEvents"
);


// ============================================
// CREATE TASK SERVICE
// ============================================

const createTaskService = async (
  data,
  user,
  ipAddress
) => {
  const task = await createTask({
    ...data,
    assigned_by: user.id,
  });

  // ============================================
  // NOTIFICATION EVENT
  // ============================================

  await taskAssignedEvent({
    userId: task.assigned_to,
    taskTitle: task.title,
  });

  // ============================================
  // AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: user.id,
    action: "CREATE_TASK",
    entity_name: "tasks",
    entity_id: task.id,
    new_values: task,
    ip_address: ipAddress,
  });

  return task;
};


// ============================================
// GET TASKS SERVICE
// ============================================

const getTasksService = async (
  filters
) => {
  return await getTasks(filters);
};


// ============================================
// UPDATE TASK SERVICE
// ============================================

const updateTaskService = async (
  taskId,
  updateData,
  user,
  ipAddress
) => {
  const task =
    await findTaskById(taskId);

  if (!task) {
    throw new AppError(
      "Task not found",
      404
    );
  }

  // ============================================
  // EMPLOYEE SECURITY
  // ============================================

  if (
    user.role === "EMPLOYEE" &&
    task.assigned_to !== user.id
  ) {
    throw new AppError(
      "Access denied",
      403
    );
  }

  const updatedTask =
    await updateTask(
      taskId,
      updateData
    );

  // ============================================
  // AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: user.id,
    action: "UPDATE_TASK",
    entity_name: "tasks",
    entity_id: taskId,
    old_values: task,
    new_values: updatedTask,
    ip_address: ipAddress,
  });

  return updatedTask;
};


// ============================================
// DELETE TASK SERVICE
// ============================================

const deleteTaskService = async (
  taskId,
  user,
  ipAddress
) => {
  const existingTask =
    await findTaskById(taskId);

  if (!existingTask) {
    throw new AppError(
      "Task not found",
      404
    );
  }

  await deleteTask(taskId);

  // ============================================
  // AUDIT LOG
  // ============================================

  await createAuditLog({
    user_id: user.id,
    action: "DELETE_TASK",
    entity_name: "tasks",
    entity_id: taskId,
    old_values: existingTask,
    ip_address: ipAddress,
  });
};


// ============================================
// RESTORE TASK SERVICE
// ============================================

const restoreTaskService =
  async (
    taskId,
    user,
    ipAddress
  ) => {
    await restoreTask(taskId);

    const restoredTask =
      await findTaskById(taskId);

    // ============================================
    // AUDIT LOG
    // ============================================

    await createAuditLog({
      user_id: user.id,
      action: "RESTORE_TASK",
      entity_name: "tasks",
      entity_id: taskId,
      new_values: restoredTask,
      ip_address: ipAddress,
    });
  };


// ============================================
// ADD COMMENT SERVICE
// ============================================

const addTaskCommentService =
  async (
    data,
    user,
    ipAddress
  ) => {
    const comment =
      await addTaskComment({
        ...data,
        user_id: user.id,
      });

    // ============================================
    // AUDIT LOG
    // ============================================

    await createAuditLog({
      user_id: user.id,
      action: "TASK_COMMENT",
      entity_name: "task_comments",
      entity_id: comment.id,
      new_values: comment,
      ip_address: ipAddress,
    });

    return comment;
  };


// ============================================
// GET COMMENTS SERVICE
// ============================================

const getTaskCommentsService =
  async (taskId) => {
    return await getTaskComments(
      taskId
    );
  };


// ============================================
// OVERDUE TASKS SERVICE
// ============================================

const getOverdueTasksService =
  async () => {
    return await getOverdueTasks();
  };


// ============================================
// EXPORTS
// ============================================

module.exports = {
  createTaskService,
  getTasksService,
  updateTaskService,
  deleteTaskService,
  restoreTaskService,

  addTaskCommentService,
  getTaskCommentsService,

  getOverdueTasksService,
};