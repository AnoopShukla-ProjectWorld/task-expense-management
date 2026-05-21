require("dotenv").config();

const validateEnv = require(
  "./config/validateEnv"
);

validateEnv();

const app = require("./app");

require("./config/db");

require(
  "./jobs/cleanupTokensJob"
);

require(
  "./jobs/cleanupSessionsJob"
);

const PORT =
  process.env.PORT || 5000;


// ============================================
// START SERVER
// ============================================

const server = app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);


// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on(
  "SIGINT",
  () => {
    console.log(
      "Gracefully shutting down..."
    );

    server.close(() => {
      process.exit(0);
    });
  }
);

process.on(
  "SIGTERM",
  () => {
    console.log(
      "SIGTERM received. Closing server..."
    );

    server.close(() => {
      process.exit(0);
    });
  }
);