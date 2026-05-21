const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const roleMiddleware = require(
  "../middlewares/roleMiddleware"
);

const validateMiddleware = require(
  "../middlewares/validateMiddleware"
);

const {
  createTaskValidation,
  updateTaskValidation,
  taskCommentValidation,
} = require(
  "../validations/taskValidation"
);

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  restoreTask,

  addComment,
  getComments,

  overdueTasks,
} = require(
  "../controllers/taskController"
);


// ============================================
// TASK ROUTES
// ============================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  createTaskValidation,
  validateMiddleware,
  createTask
);

router.get(
  "/",
  authMiddleware,
  getTasks
);

router.put(
  "/:id",
  authMiddleware,
  updateTaskValidation,
  validateMiddleware,
  updateTask
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  deleteTask
);

router.patch(
  "/restore/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  restoreTask
);


// ============================================
// COMMENTS
// ============================================

router.post(
  "/:taskId/comments",
  authMiddleware,
  taskCommentValidation,
  validateMiddleware,
  addComment
);

router.get(
  "/:taskId/comments",
  authMiddleware,
  getComments
);


// ============================================
// OVERDUE TASKS
// ============================================

router.get(
  "/analytics/overdue",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  overdueTasks
);

module.exports = router;