const notificationsService = require("./notifications.service");
const sseHub = require("./notifications.sse");
const { sendSuccess } = require("../../shared/response/apiResponse");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { verifyAccessToken } = require("../../shared/utils/token.util");

function unauthorizedError() {
  return new AppError({
    message: "Unauthorized",
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_UNAUTHORIZED,
  });
}

function authenticateStreamToken(token) {
  if (typeof token !== "string" || token.trim() === "") {
    throw unauthorizedError();
  }

  const payload = verifyAccessToken(token);
  if (!payload?.userId || !payload?.email || !payload?.role) {
    throw unauthorizedError();
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

module.exports = Object.freeze({
  async list(req, res, next) {
    try {
      const notifications = await notificationsService.list(req.user, req.query);
      return sendSuccess(res, { message: "Notifications retrieved successfully", data: notifications });
    } catch (error) {
      return next(error);
    }
  },

  async unreadCount(req, res, next) {
    try {
      const result = await notificationsService.getUnreadCount(req.user);
      return sendSuccess(res, { message: "Unread notification count retrieved successfully", data: result });
    } catch (error) {
      return next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationsService.markAsRead(req.user, req.params.id);
      return sendSuccess(res, { message: "Notification marked as read", data: notification });
    } catch (error) {
      return next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAllAsRead(req.user);
      return sendSuccess(res, { message: "Notifications marked as read", data: result });
    } catch (error) {
      return next(error);
    }
  },

  stream(req, res, next) {
    let authenticatedUser;

    try {
      authenticatedUser = authenticateStreamToken(req.query.token);
    } catch (error) {
      return next(error);
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const removeClient = sseHub.addClient(authenticatedUser.userId, res);
    const heartbeat = globalThis.setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25000);

    req.on("close", () => {
      globalThis.clearInterval(heartbeat);
      removeClient();
      res.end();
    });
  },
});
