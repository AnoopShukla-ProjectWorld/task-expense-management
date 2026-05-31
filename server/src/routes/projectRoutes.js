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
  createProjectValidation,
  updateProjectValidation,
} = require(
  "../validations/projectValidation"
);

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  restoreProject,
} = require(
  "../controllers/projectController"
);


const upload = require("../middlewares/uploadMiddleware");

// ============================================
// PROJECT ROUTES
// ============================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  upload.single("document"),
  createProjectValidation,
  validateMiddleware,
  createProject
);

router.get(
  "/",
  authMiddleware,
  getProjects
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "ADMIN",
    "MANAGER"
  ),
  upload.single("document"),
  updateProjectValidation,
  validateMiddleware,
  updateProject
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteProject
);

router.patch(
  "/restore/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  restoreProject
);

module.exports = router;