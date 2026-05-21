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
      .isIn([
        "TRAVEL",
        "FOOD",
        "ACCOMMODATION",
        "OFFICE_SUPPLIES",
        "MISCELLANEOUS",
      ])
      .withMessage(
        "Invalid category"
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