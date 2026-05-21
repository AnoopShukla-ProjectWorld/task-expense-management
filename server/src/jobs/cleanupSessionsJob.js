const cron = require(
  "node-cron"
);

const {
  deactivateExpiredSessions,
} = require(
  "../repositories/authRepository"
);


// ============================================
// RUN DAILY
// ============================================

cron.schedule(
  "0 1 * * *",
  async () => {
    console.log(
      "Running session cleanup..."
    );

    await deactivateExpiredSessions();
  }
);