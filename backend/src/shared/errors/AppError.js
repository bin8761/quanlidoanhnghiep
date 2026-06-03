const ERROR_CODES = require("./errorCodes");

class AppError extends Error {
  constructor({
    message,
    statusCode = 500,
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details,
    isOperational = true,
  }) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
