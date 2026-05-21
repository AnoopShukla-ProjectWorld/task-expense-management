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

const upload = require(
  "../middlewares/uploadMiddleware"
);

const {
  createExpense,
  getAllExpenses,
  reviewExpense,
  deleteExpense,
} = require(
  "../controllers/expenseController"
);

const {
  createExpenseValidation,
  updateExpenseStatusValidation,
} = require(
  "../validations/expenseValidation"
);


// ============================================
// CREATE EXPENSE
// ============================================

router.post(
  "/",
  authMiddleware,

  upload.single("receipt"),

  createExpenseValidation,

  validateMiddleware,

  createExpense
);


// ============================================
// GET EXPENSES
// ============================================

router.get(
  "/",
  authMiddleware,
  getAllExpenses
);


// ============================================
// REVIEW EXPENSE
// ============================================

router.patch(
  "/:id/review",

  authMiddleware,

  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),

  updateExpenseStatusValidation,

  validateMiddleware,

  reviewExpense
);


// ============================================
// DELETE EXPENSE
// ============================================

router.delete(
  "/:id",

  authMiddleware,

  deleteExpense
);

module.exports = router;