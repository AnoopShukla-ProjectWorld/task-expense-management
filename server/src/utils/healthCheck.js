const healthCheck = (
  req,
  res
) => {
  return res.status(200).json({
    success: true,

    message:
      "Server healthy",

    uptime:
      process.uptime(),

    timestamp:
      new Date(),
  });
};

module.exports =
  healthCheck;