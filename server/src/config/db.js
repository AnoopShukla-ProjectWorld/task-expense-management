const sql = require("mssql");

const env = require("./env");

const dbConfig = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  server: env.DB_SERVER,
  database: env.DB_NAME,

  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(dbConfig);

const poolConnect = pool
  .connect()
  .then(() => {
    console.log("✅ MSSQL Connected Successfully");
  })
  .catch((err) => {
    console.error(
      "❌ MSSQL Connection Failed:",
      err
    );
  });

module.exports = {
  sql,
  pool,
  poolConnect,
};