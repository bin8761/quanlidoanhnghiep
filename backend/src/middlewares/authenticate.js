const AppError = require("../shared/errors/AppError");
const prisma = require("../config/database");
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

function createInactiveAccountError() {
  return new AppError({
    message: "Account is inactive",
    statusCode: 403,
    errorCode: ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
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

async function readAuthenticatedUserState(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      employee: {
        select: {
          status: true,
        },
      },
    },
  });
}

function assertActiveUser(userRecord) {
  if (!userRecord) {
    throw createUnauthorizedError();
  }

  if (userRecord.isActive !== true) {
    throw createInactiveAccountError();
  }

  if (userRecord.employee && userRecord.employee.status !== "ACTIVE") {
    throw createInactiveAccountError();
  }
}

function mapPersistedUserToSafeAuthenticatedUser(userRecord) {
  return Object.freeze({
    userId: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
  });
}

async function authenticate(req, res, next) {
  let decodedUser;

  try {
    const authorizationHeader = req.headers?.[AUTHORIZATION_HEADER];
    const token = parseBearerToken(authorizationHeader);
    const decodedPayload = verifyAccessToken(token);
    decodedUser = toSafeAuthenticatedUser(decodedPayload);
  } catch {
    return next(createUnauthorizedError());
  }

  try {
    const persistedUser = await readAuthenticatedUserState(decodedUser.userId);
    assertActiveUser(persistedUser);

    const safeUser = mapPersistedUserToSafeAuthenticatedUser(persistedUser);

    req.user = safeUser;
    res.locals.user = safeUser;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
