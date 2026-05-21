const logger = require(
  "../config/logger"
);


const requestLoggerMiddleware =
  (
    req,
    res,
    next
  ) => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    next();
  };


module.exports =
  requestLoggerMiddleware;