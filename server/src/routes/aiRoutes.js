const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { queryAIAssistant } = require("../controllers/aiController");

// Register POST /api/v1/ai/chat
// Restricted unconditionally to authenticated Portal Administrators
router.post("/chat", authMiddleware, roleMiddleware("ADMIN"), queryAIAssistant);

module.exports = router;
