const {
  logActivity,
} = require("../services/auditService");


// ============================================
// AUDIT MIDDLEWARE
// ============================================

const auditMiddleware =
  ({
    action,
    entity,
  }) =>
  async (req, res, next) => {
    try {
      const originalJson =
        res.json;

      res.json = function (body) {
        if (
          body.success &&
          req.user
        ) {
          logActivity({
            userId:
              req.user.id,
            action,
            entityName:
              entity,
            entityId:
              body?.data?.id ||
              null,
            ipAddress:
              req.ip,
          });
        }

        return originalJson.call(
          this,
          body
        );
      };

      next();
    } catch (error) {
      next();
    }
  };

module.exports =
  auditMiddleware;