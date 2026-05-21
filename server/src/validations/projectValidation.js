const { body } = require("express-validator");

const createProjectValidation = [
  body("project_name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage(
      "Project name must be between 3 and 150 characters"
    ),

  body("description")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Description too long"),

  body("start_date")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date"),

  body("end_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date"),

  body("assigned_manager_id")
    .notEmpty()
    .withMessage("Manager is required")
    .isInt()
    .withMessage("Invalid manager"),

  body("priority")
    .optional()
    .isIn([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ])
    .withMessage("Invalid priority"),
];

const updateProjectValidation = [
  body("project_name")
    .optional()
    .isLength({ min: 3, max: 150 }),

  body("status")
    .optional()
    .isIn([
      "PLANNED",
      "ACTIVE",
      "ON_HOLD",
      "COMPLETED",
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
];

module.exports = {
  createProjectValidation,
  updateProjectValidation,
};