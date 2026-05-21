const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require("../utils/apiResponse");

const {
  createTaskService,
  getTasksService,
  updateTaskService,
  deleteTaskService,
  restoreTaskService,
  addTaskCommentService,
  getTaskCommentsService,
  getOverdueTasksService,
} = require(
  "../services/taskService"
);


// ============================================
// CREATE TASK
// ============================================

const createTask = asyncHandler(
  async (req, res) => {
    const task =
      await createTaskService(
        req.body,
        req.user
      );

    return successResponse(
      res,
      201,
      "Task created successfully",
      task
    );
  }
);


// ============================================
// GET TASKS
// ============================================

const getTasks = asyncHandler(
  async (req, res) => {
    const tasks =
      await getTasksService({
        page:
          Number(req.query.page) || 1,
        limit:
          Number(req.query.limit) ||
          10,
        search: req.query.search,
        status: req.query.status,
        assigned_to:
          req.query.assigned_to,
      });

    return successResponse(
      res,
      200,
      "Tasks fetched successfully",
      tasks
    );
  }
);


// ============================================
// UPDATE TASK
// ============================================

const updateTask = asyncHandler(
  async (req, res) => {
    const task =
      await updateTaskService(
        req.params.id,
        req.body,
        req.user
      );

    return successResponse(
      res,
      200,
      "Task updated successfully",
      task
    );
  }
);


// ============================================
// DELETE TASK
// ============================================

const deleteTask = asyncHandler(
  async (req, res) => {
    await deleteTaskService(
      req.params.id,
      req.user
    );

    return successResponse(
      res,
      200,
      "Task deleted successfully"
    );
  }
);


// ============================================
// RESTORE TASK
// ============================================

const restoreTask =
  asyncHandler(
    async (req, res) => {
      await restoreTaskService(
        req.params.id,
        req.user
      );

      return successResponse(
        res,
        200,
        "Task restored successfully"
      );
    }
  );


// ============================================
// ADD COMMENT
// ============================================

const addComment = asyncHandler(
  async (req, res) => {
    const comment =
      await addTaskCommentService(
        {
          task_id:
            req.params.taskId,
          comment:
            req.body.comment,
        },
        req.user
      );

    return successResponse(
      res,
      201,
      "Comment added",
      comment
    );
  }
);


// ============================================
// GET COMMENTS
// ============================================

const getComments = asyncHandler(
  async (req, res) => {
    const comments =
      await getTaskCommentsService(
        req.params.taskId
      );

    return successResponse(
      res,
      200,
      "Comments fetched",
      comments
    );
  }
);


// ============================================
// GET OVERDUE TASKS
// ============================================

const overdueTasks =
  asyncHandler(
    async (req, res) => {
      const tasks =
        await getOverdueTasksService();

      return successResponse(
        res,
        200,
        "Overdue tasks fetched",
        tasks
      );
    }
  );

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  restoreTask,

  addComment,
  getComments,

  overdueTasks,
};