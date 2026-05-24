const { body } = require("express-validator");

const validatePhoneNumber = body("phone_number")
  .optional({ checkFalsy: true })
  .trim()
  .custom((value) => {
    if (!value) return true;
    if (value.startsWith("+91")) {
      const local = value.slice(3);
      if (!/^[6-9]\d{9}$/.test(local)) {
        throw new Error("India number must be 10 digits starting 6-9");
      }
    } else if (value.startsWith("+1")) {
      const local = value.slice(2);
      if (!/^\d{10}$/.test(local)) {
        throw new Error("USA/Canada number must be 10 digits");
      }
    } else if (value.startsWith("+44")) {
      const local = value.slice(3);
      if (!/^7\d{9}$/.test(local)) {
        throw new Error("UK number must be 10 digits starting with 7");
      }
    } else if (value.startsWith("+971")) {
      const local = value.slice(4);
      if (!/^5\d{8}$/.test(local)) {
        throw new Error("UAE number must be 9 digits starting with 5");
      }
    } else {
      throw new Error("Invalid country code. Supported: +91, +1, +44, +971");
    }
    return true;
  });

// ============================================
// CREATE USER VALIDATION
// ============================================

const createUserValidation = [
  body("first_name")
    .trim()
    .custom((value, { req }) => {
      if (!value && !req.body.full_name) {
        throw new Error("First name is required");
      }
      if (value && !/^[a-zA-Z\s\'-]+$/.test(value)) {
        throw new Error("First name can only contain letters, spaces, hyphens, and apostrophes");
      }
      return true;
    }),

  body("last_name")
    .trim()
    .custom((value, { req }) => {
      if (!value && !req.body.full_name) {
        throw new Error("Last name is required");
      }
      if (value && !/^[a-zA-Z\s\'-]+$/.test(value)) {
        throw new Error("Last name can only contain letters, spaces, hyphens, and apostrophes");
      }
      return true;
    }),

  body("full_name")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z\s\'-]+$/)
    .withMessage("Full name can only contain letters, spaces, hyphens, and apostrophes"),

  body("email")
    .isEmail()
    .withMessage("Valid email required"),

  body("employee_id")
    .optional()
    .trim(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["manager", "employee", "admin", "pending"])
    .withMessage("Valid role required"),

  body("department_id")
    .optional()
    .isInt()
    .withMessage("Department ID must be integer"),

  validatePhoneNumber,
];

// ============================================
// UPDATE USER VALIDATION
// ============================================

const updateUserValidation = [
  body("first_name")
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s\'-]+$/)
    .withMessage("First name can only contain letters, spaces, hyphens, and apostrophes"),

  body("last_name")
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s\'-]+$/)
    .withMessage("Last name can only contain letters, spaces, hyphens, and apostrophes"),

  body("full_name")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z\s\'-]+$/)
    .withMessage("Full name can only contain letters, spaces, hyphens, and apostrophes"),

  validatePhoneNumber,

  body("status")
    .optional()
    .isIn(["approved", "pending", "rejected", "suspended"])
    .withMessage("Invalid status"),

  body("role")
    .optional()
    .trim()
    .isIn(["manager", "employee", "admin", "pending"])
    .withMessage("Invalid role"),

  body("department_id")
    .optional()
    .isInt(),
];

module.exports = {
  createUserValidation,
  updateUserValidation,
};