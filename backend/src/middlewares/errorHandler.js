const env = require("../config/env");
const logger = require("../config/logger");
const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");
const { sendError } = require("../shared/response/apiResponse");

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    message: "Internal server error",
    statusCode: 500,
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    isOperational: false,
  });
}

function logError(error, req) {
  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    message: error.message,
  };

  if (env.nodeEnv !== "production" && error.stack) {
    logPayload.stack = error.stack;
  }

  logger.error({ err: error, ...logPayload }, "Request failed");
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = normalizeError(error);

  logError(normalizedError, req);

  return sendError(res, {
    statusCode: normalizedError.statusCode,
    message: normalizedError.message,
    errorCode: normalizedError.errorCode,
    requestId: req.requestId,
    details: normalizedError.details,
  });
}

module.exports = errorHandler;
