const { body } = require("express-validator");

const createTaskValidation = [
  body("project_id")
    .optional({ nullable: true, checkFalsy: true })
    .isInt()
    .withMessage("Invalid project"),

  body("assigned_to")
    .notEmpty()
    .withMessage("Assignee required")
    .isInt()
    .withMessage("Invalid assignee"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title required")
    .isLength({ min: 3, max: 200 })
    .withMessage(
      "Title must be between 3 and 200 characters"
    ),

  body("description")
    .optional()
    .isLength({ max: 5000 }),

  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid due date"),

  body("start_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid start date")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(value);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),

  body("priority")
    .optional()
    .isIn([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ]),
];

const updateTaskValidation = [
  body("status")
    .optional()
    .isIn([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "ON_HOLD",
      "CANCELLED",
    ]),

  body("priority")
    .optional()
    .isIn([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ]),

  body("completion_percentage")
    .optional()
    .isInt({
      min: 0,
      max: 100,
    }),
];

const taskCommentValidation = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment required")
    .isLength({ max: 2000 }),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskCommentValidation,
};