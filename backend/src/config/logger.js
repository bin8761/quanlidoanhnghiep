const pino = require("pino");

const LOGGER_REDACT_PATHS = [
  "password",
  "currentPassword",
  "newPassword",
  "confirmNewPassword",
  "passwordHash",
  "otp",
  "otpCode",
  "otpCodeHash",
  "rawOtp",
  "rawPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "headers.authorization",
  "req.headers.authorization",
];

function createLogger(options = {}) {
  const {
    level = process.env.NODE_ENV === "production" ? "info" : "debug",
    stream,
  } = options;

  return pino(
    {
      level,
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: LOGGER_REDACT_PATHS,
        censor: "[REDACTED]",
      },
    },
    stream,
  );
}

const logger = createLogger();

module.exports = logger;
module.exports.logger = logger;
module.exports.createLogger = createLogger;
module.exports.LOGGER_REDACT_PATHS = LOGGER_REDACT_PATHS;
