const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnreadCount,
} = require(
  "../controllers/notificationController"
);


// ============================================
// GET NOTIFICATIONS
// ============================================

router.get(
  "/",
  authMiddleware,
  getNotifications
);


// ============================================
// GET UNREAD COUNT
// ============================================

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);


// ============================================
// MARK AS READ
// ============================================

router.patch(
  "/:id/read",
  authMiddleware,
  markAsRead
);


// ============================================
// MARK ALL AS READ
// ============================================

router.patch(
  "/read-all",
  authMiddleware,
  markAllAsRead
);


// ============================================
// DELETE
// ============================================

router.delete(
  "/:id",
  authMiddleware,
  removeNotification
);

module.exports = router;