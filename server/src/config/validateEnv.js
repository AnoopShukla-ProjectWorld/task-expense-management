const requiredEnvs = [
  "PORT",

  "DB_SERVER",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",

  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",

  "ACCESS_TOKEN_EXPIRES",
  "REFRESH_TOKEN_EXPIRES",

  "CLIENT_URL",
];


const validateEnv = () => {
  requiredEnvs.forEach(
    (envVar) => {
      if (
        !process.env[envVar]
      ) {
        throw new Error(
          `Missing environment variable: ${envVar}`
        );
      }
    }
  );
};


module.exports =
  validateEnv;