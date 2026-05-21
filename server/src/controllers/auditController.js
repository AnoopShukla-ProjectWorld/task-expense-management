const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require(
  "../utils/apiResponse"
);

const {
  getAuditLogsService,
} = require(
  "../services/auditService"
);


// ============================================
// GET AUDIT LOGS
// ============================================

const getAuditLogs =
  asyncHandler(
    async (req, res) => {
      const page =
        Number(req.query.page) ||
        1;

      const limit =
        Number(req.query.limit) ||
        10;

      const search =
        req.query.search || "";

      const logs =
        await getAuditLogsService(
          {
            page,
            limit,
            search,
          }
        );

      return successResponse(
        res,
        200,
        "Audit logs fetched successfully",
        logs
      );
    }
  );


module.exports = {
  getAuditLogs,
};