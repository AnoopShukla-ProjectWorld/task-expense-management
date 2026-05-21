const cron = require(
  "node-cron"
);

const {
  cleanupExpiredTokens,
} = require(
  "../repositories/authRepository"
);


// ============================================
// RUN DAILY
// ============================================

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log(
      "Running token cleanup..."
    );

    await cleanupExpiredTokens();
  }
);