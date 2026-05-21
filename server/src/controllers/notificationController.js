const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require(
  "../utils/apiResponse"
);

const {
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  getUnreadCountService,
} = require(
  "../services/notificationService"
);


// ============================================
// GET NOTIFICATIONS
// ============================================

const getNotifications =
  asyncHandler(
    async (req, res) => {
      const notifications =
        await getNotificationsService(
          {
            userId:
              req.user.id,

            page:
              Number(
                req.query.page
              ) || 1,

            limit:
              Number(
                req.query.limit
              ) || 10,

            isRead:
              req.query.isRead,
          }
        );

      return successResponse(
        res,
        200,
        "Notifications fetched successfully",
        notifications
      );
    }
  );


// ============================================
// MARK AS READ
// ============================================

const markAsRead =
  asyncHandler(
    async (req, res) => {
      await markAsReadService(
        req.params.id,
        req.user.id
      );

      return successResponse(
        res,
        200,
        "Notification marked as read"
      );
    }
  );


// ============================================
// MARK ALL AS READ
// ============================================

const markAllAsRead =
  asyncHandler(
    async (req, res) => {
      await markAllAsReadService(
        req.user.id
      );

      return successResponse(
        res,
        200,
        "All notifications marked as read"
      );
    }
  );


// ============================================
// DELETE NOTIFICATION
// ============================================

const removeNotification =
  asyncHandler(
    async (req, res) => {
      await deleteNotificationService(
        req.params.id,
        req.user.id
      );

      return successResponse(
        res,
        200,
        "Notification deleted successfully"
      );
    }
  );


// ============================================
// GET UNREAD COUNT
// ============================================

const getUnreadCount =
  asyncHandler(
    async (req, res) => {
      const count =
        await getUnreadCountService(
          req.user.id
        );

      return successResponse(
        res,
        200,
        "Unread count fetched",
        count
      );
    }
  );

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnreadCount,
};