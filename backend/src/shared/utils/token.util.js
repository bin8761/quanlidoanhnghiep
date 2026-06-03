const jwt = require("jsonwebtoken");
const { assertUuidString } = require("./id.util");

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

function readJwtConfig() {
  const env = require("../../config/env");

  return {
    secret: env.jwtSecret,
    expiresIn: env.jwtExpiresIn,
  };
}

function assertTokenPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("payload must be an object");
  }

  assertUuidString(payload.userId, "payload.userId");
  assertNonEmptyString(payload.role, "payload.role");
  assertNonEmptyString(payload.email, "payload.email");
}

function signAccessToken(
  payload,
  {
    secret,
    expiresIn,
  } = {},
) {
  assertTokenPayload(payload);

  const jwtConfig = secret == null || expiresIn == null ? readJwtConfig() : null;
  const resolvedSecret = secret ?? jwtConfig.secret;
  const resolvedExpiresIn = expiresIn ?? jwtConfig.expiresIn;

  assertNonEmptyString(resolvedSecret, "secret");
  assertNonEmptyString(resolvedExpiresIn, "expiresIn");

  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    },
    resolvedSecret,
    {
      expiresIn: resolvedExpiresIn,
    },
  );
}

function verifyAccessToken(token, { secret } = {}) {
  assertNonEmptyString(token, "token");

  const jwtConfig = secret == null ? readJwtConfig() : null;
  const resolvedSecret = secret ?? jwtConfig.secret;

  assertNonEmptyString(resolvedSecret, "secret");

  return jwt.verify(token, resolvedSecret);
}

module.exports = Object.freeze({
  signAccessToken,
  verifyAccessToken,
});
