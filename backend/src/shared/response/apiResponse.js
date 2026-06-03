const ERROR_CODES = require("../errors/errorCodes");

function sendSuccess(res, options = {}) {
  const {
    statusCode = 200,
    message = "Operation successful",
    data,
  } = options;

  const payload = {
    success: true,
    message: message.trim(),
    data: typeof data === "undefined" ? {} : data,
  };

  return res.status(statusCode).json(payload);
}

function sendError(res, options = {}) {
  const {
    statusCode = 500,
    message = "Internal server error",
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    requestId,
    details,
  } = options;

  const payload = {
    success: false,
    message: message.trim(),
    errorCode: errorCode.trim(),
  };

  if (typeof requestId === "string" && requestId.trim() !== "") {
    payload.requestId = requestId.trim();
  }

  if (typeof details !== "undefined") {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError,
};
