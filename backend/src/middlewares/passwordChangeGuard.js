const prisma = require("../config/database");
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

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = passwordChangeGuard;
