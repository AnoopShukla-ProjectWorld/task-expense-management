const sql = require("mssql");

const {
  pool,
} = require("../config/db");


// ============================================
// CREATE NOTIFICATION
// ============================================

const createNotification =
  async ({
    userId,
    title,
    message,
    type = "GENERAL",
  }) => {
    const result =
      await pool
        .request()
        .input(
          "userId",
          sql.Int,
          userId
        )
        .input(
          "title",
          sql.NVarChar,
          title
        )
        .input(
          "message",
          sql.NVarChar(sql.MAX),
          message
        )
        .input(
          "type",
          sql.NVarChar,
          type
        )
        .query(`
          INSERT INTO notifications
          (
            user_id,
            title,
            message,
            type
          )

          OUTPUT INSERTED.*

          VALUES
          (
            @userId,
            @title,
            @message,
            @type
          )
        `);

    return result.recordset[0];
  };


// ============================================
// GET USER NOTIFICATIONS
// ============================================

const getUserNotifications =
  async ({
    userId,
    page = 1,
    limit = 10,
    isRead,
  }) => {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;
    const offset =
      (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = @userId
    `;

    if (
      isRead !== undefined
    ) {
      query += `
        AND is_read = ${isRead}
      `;
    }

    query += `
      ORDER BY created_at DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parsedLimit} ROWS ONLY
    `;

    const result =
      await pool
        .request()
        .input(
          "userId",
          sql.Int,
          userId
        )
        .query(query);

    return result.recordset;
  };


// ============================================
// MARK AS READ
// ============================================

const markNotificationAsRead =
  async (
    notificationId,
    userId
  ) => {
    await pool
      .request()
      .input(
        "notificationId",
        sql.Int,
        notificationId
      )
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        UPDATE notifications

        SET
          is_read = 1

        WHERE id = @notificationId
        AND user_id = @userId
      `);
  };


// ============================================
// MARK ALL AS READ
// ============================================

const markAllNotificationsAsRead =
  async (userId) => {
    await pool
      .request()
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        UPDATE notifications

        SET
          is_read = 1

        WHERE user_id = @userId
      `);
  };


// ============================================
// DELETE NOTIFICATION
// ============================================

const deleteNotification =
  async (
    notificationId,
    userId
  ) => {
    await pool
      .request()
      .input(
        "notificationId",
        sql.Int,
        notificationId
      )
      .input(
        "userId",
        sql.Int,
        userId
      )
      .query(`
        DELETE FROM notifications

        WHERE id = @notificationId
        AND user_id = @userId
      `);
  };


// ============================================
// GET UNREAD COUNT
// ============================================

const getUnreadCount =
  async (userId) => {
    const result =
      await pool
        .request()
        .input(
          "userId",
          sql.Int,
          userId
        )
        .query(`
          SELECT COUNT(*) AS unreadCount

          FROM notifications

          WHERE user_id = @userId
          AND is_read = 0
        `);

    return result.recordset[0];
  };

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
};