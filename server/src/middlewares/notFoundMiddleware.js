const {
  errorResponse,
} = require(
  "../utils/apiResponse"
);


const notFoundMiddleware =
  (
    req,
    res
  ) => {
    return errorResponse(
      res,
      404,
      "Route not found"
    );
  };


module.exports =
  notFoundMiddleware;