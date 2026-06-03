const logger = require("../config/logger");
const { isUuidString } = require("../shared/utils/id.util");

function getSafeUserMetadata(user) {
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const safeUserMetadata = {};

  if (isUuidString(user.userId)) {
    safeUserMetadata.userId = user.userId;
  } else if (isUuidString(user.id)) {
    safeUserMetadata.userId = user.id;
  }

  if (typeof user.email === "string" && user.email.trim() !== "") {
    safeUserMetadata.email = user.email.trim();
  }

  if (typeof user.role === "string" && user.role.trim() !== "") {
    safeUserMetadata.role = user.role.trim();
  }

  if (Object.keys(safeUserMetadata).length === 0) {
    return undefined;
  }

  return safeUserMetadata;
}

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationInMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const logPayload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Number(durationInMilliseconds.toFixed(3)),
    };

    const safeUserMetadata = getSafeUserMetadata(req.user);

    if (safeUserMetadata) {
      logPayload.user = safeUserMetadata;
    }

    logger.info(logPayload, "Request completed");
  });

  next();
}

module.exports = requestLogger;
