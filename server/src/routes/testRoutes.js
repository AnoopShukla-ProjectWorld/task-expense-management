const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const roleMiddleware = require(
  "../middlewares/roleMiddleware"
);

router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Welcome Admin",
    });
  }
);

module.exports = router;