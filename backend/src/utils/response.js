const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
  extra = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

const sendError = (
  res,
  error = "Internal Server Error",
  statusCode = 500,
  extra = {}
) => {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === "string" ? error : error?.message || "Internal Server Error",
    ...extra,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
