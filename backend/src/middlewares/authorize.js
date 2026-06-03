const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");
const { isUuidString } = require("../shared/utils/id.util");

function createUnauthorizedError() {
  return new AppError({
    message: "Unauthorized",
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_UNAUTHORIZED,
  });
}

function createForbiddenError() {
  return new AppError({
    message: "Forbidden",
    statusCode: 403,
    errorCode: ERROR_CODES.AUTH_FORBIDDEN,
  });
}

function normalizeRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new TypeError("authorize requires at least one role");
  }

  const normalizedRoles = roles.map((role) => {
    if (typeof role !== "string" || role.trim() === "") {
      throw new TypeError("authorize roles must be non-empty strings");
    }

    return role.trim();
  });

  return Object.freeze(normalizedRoles);
}

function hasSafeAuthenticatedUser(user) {
  return Boolean(
    user
      && typeof user === "object"
      && isUuidString(user.userId)
      && typeof user.email === "string"
      && user.email.trim() !== ""
      && typeof user.role === "string"
      && user.role.trim() !== "",
  );
}

function authorize(...roles) {
  const allowedRoles = normalizeRoles(roles);

  return function authorizeMiddleware(req, res, next) {
    if (!hasSafeAuthenticatedUser(req.user)) {
      return next(createUnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createForbiddenError());
    }

    return next();
  };
}

module.exports = authorize;
