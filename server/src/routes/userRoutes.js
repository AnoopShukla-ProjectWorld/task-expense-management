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
  createUserValidation,
  updateUserValidation,
} = require(
  "../validations/userValidation"
);

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getProfile,
  updateProfile,
  approveUser,
  rejectUser,
  suspendUser,
} = require(
  "../controllers/userController"
);


// ============================================
// ADMIN ROUTES
// ============================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createUserValidation,
  validateMiddleware,
  createUser
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  getUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getUserById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateUserValidation,
  validateMiddleware,
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteUser
);

router.patch(
  "/:id/restore",
  authMiddleware,
  roleMiddleware("ADMIN"),
  restoreUser
);

// Onboarding Approvals / Actions
router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  approveUser
);

router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("ADMIN"),
  rejectUser
);

router.put(
  "/:id/suspend",
  authMiddleware,
  roleMiddleware("ADMIN"),
  suspendUser
);


const upload = require("../middlewares/uploadMiddleware");

// ============================================
// PROFILE ROUTES
// ============================================

router.get(
  "/profile/me",
  authMiddleware,
  getProfile
);

router.put(
  "/profile/me",
  authMiddleware,
  upload.single("profile_image"),
  updateUserValidation,
  validateMiddleware,
  updateProfile
);

module.exports = router;