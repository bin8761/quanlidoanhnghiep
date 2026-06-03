const prisma = require("../config/database");
const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");
const { isUuidString } = require("../shared/utils/id.util");
const {
  PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS,
} = require("../shared/constants/passwordChangeEndpoints");

const ALLOWED_ENDPOINTS = new Set(PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS);

function createUnauthorizedError() {
  return new AppError({
    message: "Unauthorized",
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_UNAUTHORIZED,
  });
}

function createPasswordChangeRequiredError() {
  return new AppError({
    message: "Password change required",
    statusCode: 403,
    errorCode: ERROR_CODES.AUTH_PASSWORD_CHANGE_REQUIRED,
  });
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

function buildEndpointKey(req) {
  const method = typeof req.method === "string" ? req.method.toUpperCase() : "";
  const routePath = req.baseUrl && req.path
    ? `${req.baseUrl}${req.path}`
    : req.originalUrl || req.url || "";
  const normalizedPath = String(routePath).split("?")[0];

  return `${method} ${normalizedPath}`.trim();
}

async function readPasswordChangeState(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      mustChangePassword: true,
    },
  });
}

async function passwordChangeGuard(req, res, next) {
  try {
    if (!hasSafeAuthenticatedUser(req.user)) {
      return next(createUnauthorizedError());
    }

    const userState = await readPasswordChangeState(req.user.userId);

    if (!userState) {
      return next(createUnauthorizedError());
    }

    res.locals.authUserState = Object.freeze({
      mustChangePassword: userState.mustChangePassword === true,
    });

    if (userState.mustChangePassword !== true) {
      return next();
    }

    const endpointKey = buildEndpointKey(req);

    if (ALLOWED_ENDPOINTS.has(endpointKey)) {
      return next();
    }

    return next(createPasswordChangeRequiredError());
  } catch (error) {
    return next(error);
  }
}

module.exports = passwordChangeGuard;
