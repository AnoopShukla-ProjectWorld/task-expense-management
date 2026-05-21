const {
  createAuditLog,
  getAuditLogs,
} = require(
  "../repositories/auditRepository"
);


// ============================================
// LOG ACTIVITY
// ============================================

const logActivity = async (
  data
) => {
  await createAuditLog(data);
};


// ============================================
// GET AUDIT LOGS
// ============================================

const getAuditLogsService =
  async ({
    page,
    limit,
    search,
  }) => {
    return await getAuditLogs({
      page,
      limit,
      search,
    });
  };


module.exports = {
  logActivity,
  getAuditLogsService,
};