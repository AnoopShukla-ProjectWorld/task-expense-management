const {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} = require(
  "../repositories/notificationRepository"
);


// ============================================
// SEND NOTIFICATION
// ============================================

const sendNotification =
  async ({
    userId,
    title,
    message,
    type,
  }) => {
    return await createNotification({
      userId,
      title,
      message,
      type,
    });
  };


// ============================================
// GET NOTIFICATIONS
// ============================================

const getNotificationsService =
  async ({
    userId,
    page,
    limit,
    isRead,
  }) => {
    return await getUserNotifications(
      {
        userId,
        page,
        limit,
        isRead,
      }
    );
  };


// ============================================
// MARK AS READ
// ============================================

const markAsReadService =
  async (
    notificationId,
    userId
  ) => {
    await markNotificationAsRead(
      notificationId,
      userId
    );
  };


// ============================================
// MARK ALL AS READ
// ============================================

const markAllAsReadService =
  async (userId) => {
    await markAllNotificationsAsRead(
      userId
    );
  };


// ============================================
// DELETE
// ============================================

const deleteNotificationService =
  async (
    notificationId,
    userId
  ) => {
    await deleteNotification(
      notificationId,
      userId
    );
  };


// ============================================
// GET UNREAD COUNT
// ============================================

const getUnreadCountService =
  async (userId) => {
    return await getUnreadCount(
      userId
    );
  };

module.exports = {
  sendNotification,
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  getUnreadCountService,
};