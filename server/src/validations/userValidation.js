const { body } = require(
  "express-validator"
);


// ============================================
// CREATE USER VALIDATION
// ============================================

const createUserValidation = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name must contain only letters and spaces"),

  body("email")
    .isEmail()
    .withMessage("Valid email required"),

  body("employee_id")
    .trim()
    .notEmpty()
    .withMessage("Employee ID required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("role_id")
    .isInt()
    .withMessage("Valid role required"),

  body("department_id")
    .optional()
    .isInt()
    .withMessage("Department ID must be integer"),
];


// ============================================
// UPDATE USER VALIDATION
// ============================================

const updateUserValidation = [
  body("full_name")
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name must contain only letters and spaces"),

  body("phone_number")
    .optional()
    .trim(),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Invalid status"),

  body("role_id")
    .optional()
    .isInt(),

  body("department_id")
    .optional()
    .isInt(),
];

module.exports = {
  createUserValidation,
  updateUserValidation,
};