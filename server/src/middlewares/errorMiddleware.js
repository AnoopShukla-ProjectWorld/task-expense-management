const {
  errorResponse,
} = require("../utils/apiResponse");

const {
  INTERNAL_SERVER_ERROR,
} = require("../constants/httpStatus");

const {
  SERVER_ERROR,
} = require("../constants/messages");

const errorMiddleware = (
  err,
  req,
  res,
  next
) => {
  console.error(err);

  return errorResponse(
    res,
    err.statusCode || INTERNAL_SERVER_ERROR,
    err.message || SERVER_ERROR
  );
};

module.exports = errorMiddleware;