const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");
const { isUuidString } = require("../shared/utils/id.util");
const { verifyAccessToken } = require("../shared/utils/token.util");

const AUTHORIZATION_HEADER = "authorization";
const BEARER_SCHEME = "bearer";

function createUnauthorizedError() {
  return new AppError({
    message: "Unauthorized",
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_UNAUTHORIZED,
  });
}

function parseBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string" || authorizationHeader.trim() === "") {
    throw createUnauthorizedError();
  }

  const headerParts = authorizationHeader.trim().split(/\s+/);

  if (headerParts.length !== 2 || headerParts[0].toLowerCase() !== BEARER_SCHEME) {
    throw createUnauthorizedError();
  }

  const token = headerParts[1];

  if (typeof token !== "string" || token.trim() === "") {
    throw createUnauthorizedError();
  }

  return token;
}

function toSafeAuthenticatedUser(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createUnauthorizedError();
  }

  const { userId, email, role } = payload;

  if (!isUuidString(userId)) {
    throw createUnauthorizedError();
  }

  if (typeof email !== "string" || email.trim() === "") {
    throw createUnauthorizedError();
  }

  if (typeof role !== "string" || role.trim() === "") {
    throw createUnauthorizedError();
  }

  return Object.freeze({
    userId: userId.trim(),
    email: email.trim(),
    role: role.trim(),
  });
}

function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers?.[AUTHORIZATION_HEADER];
    const token = parseBearerToken(authorizationHeader);
    const decodedPayload = verifyAccessToken(token);
    const safeUser = toSafeAuthenticatedUser(decodedPayload);

    req.user = safeUser;
    res.locals.user = safeUser;

    return next();
  } catch {
    return next(createUnauthorizedError());
  }
}

module.exports = authenticate;
