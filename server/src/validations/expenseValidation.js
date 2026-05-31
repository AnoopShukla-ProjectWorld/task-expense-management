const {
  body,
  param,
} = require(
  "express-validator"
);


// ============================================
// CREATE EXPENSE
// ============================================

const createExpenseValidation =
  [
    body("amount")
      .isFloat({ min: 1 })
      .withMessage(
        "Valid amount required"
      ),

    body("category")
      .isString()
      .trim()
      .notEmpty()
      .withMessage(
        "Category is required"
      )
      .isLength({ max: 50 })
      .withMessage(
        "Category must be 50 characters or less"
      ),

    body("expense_date")
      .notEmpty()
      .withMessage(
        "Expense date required"
      ),
  ];


// ============================================
// UPDATE STATUS
// ============================================

const updateExpenseStatusValidation =
  [
    param("id")
      .isInt()
      .withMessage(
        "Valid expense ID required"
      ),

    body("status")
      .isIn([
        "APPROVED",
        "REJECTED",
      ])
      .withMessage(
        "Invalid status"
      ),
  ];

module.exports = {
  createExpenseValidation,
  updateExpenseStatusValidation,
};