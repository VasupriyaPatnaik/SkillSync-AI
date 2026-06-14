class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const logger = require("../utils/logger");

const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    logger.error("Unhandled error", { message: err.message, stack: err.stack });
  }

  return res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
    statusCode,
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
