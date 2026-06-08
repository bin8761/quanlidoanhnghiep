const notificationsRepository = require("./notifications.repository");
const sseHub = require("./notifications.sse");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { ADMIN } = require("../../shared/constants/roles");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAINTENANCE_STATUS_LABELS = Object.freeze({
  PENDING: "chờ xử lý",
  IN_PROGRESS: "đang xử lý",
  COMPLETED: "hoàn tất",
  CANCELLED: "đã hủy",
});

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function notFoundError() {
  return new AppError({
    message: "Notification not found",
    statusCode: 404,
    errorCode: ERROR_CODES.VALIDATION_ERROR,
  });
}

function normalizeNotification(notification) {
  if (!notification) return null;

  return {
    ...notification,
    isRead: Boolean(notification.readAt),
  };
}

function createNotificationsService({ repository = notificationsRepository, realtime = sseHub } = {}) {
  async function createAndPublish(data) {
    const notification = await repository.create(data);
    const normalized = normalizeNotification(notification);
    realtime.sendToUser(notification.userId, normalized);
    return normalized;
  }

  return Object.freeze({
    async list(authenticatedUser, filters = {}) {
      const notifications = await repository.findForUser(authenticatedUser.userId, {
        limit: parseLimit(filters.limit),
        unreadOnly: filters.unreadOnly === "true" || filters.unreadOnly === true,
      });

      return notifications.map(normalizeNotification);
    },

    async getUnreadCount(authenticatedUser) {
      const count = await repository.countUnread(authenticatedUser.userId);
      return { count };
    },

    async markAsRead(authenticatedUser, notificationId) {
      const notification = await repository.markAsRead(authenticatedUser.userId, notificationId);
      if (!notification) throw notFoundError();
      return normalizeNotification(notification);
    },

    async markAllAsRead(authenticatedUser) {
      const result = await repository.markAllAsRead(authenticatedUser.userId);
      return { updatedCount: result.count };
    },

    async notifyAssetAssigned(assignment) {
      const recipientUserId = assignment?.employee?.user?.id;
      if (!recipientUserId) return null;

      return createAndPublish({
        userId: recipientUserId,
        type: "ASSET_ASSIGNED",
        title: "Bạn vừa được bàn giao tài sản",
        message: `${assignment.asset?.name || "Tài sản"} đã được bàn giao cho bạn.`,
        data: {
          assignmentId: assignment.id,
          assetId: assignment.assetId,
          assetCode: assignment.asset?.assetCode,
          assetName: assignment.asset?.name,
          employeeId: assignment.employeeId,
          targetUrl: `/employee/assets/${assignment.asset?.assetCode || ""}`,
        },
      });
    },

    async notifyMaintenanceRequestCreated(request) {
      const admins = await repository.findActiveUsersByRole(ADMIN);
      if (!admins.length) return [];

      const notifications = [];
      const assetName = request.asset?.name || "Tài sản";
      const requesterName = request.requester?.fullName || "Nhân viên";

      for (const admin of admins) {
        const notification = await createAndPublish({
          userId: admin.id,
          type: "MAINTENANCE_CREATED",
          title: "Có yêu cầu sửa chữa mới",
          message: `${requesterName} vừa gửi yêu cầu sửa chữa cho ${assetName}.`,
          data: {
            maintenanceRequestId: request.id,
            assetId: request.assetId,
            assetCode: request.asset?.assetCode,
            assetName,
            requesterId: request.requesterId,
            requesterName,
            targetUrl: `/admin/maintenance?requestId=${request.id}`,
          },
        });

        notifications.push(notification);
      }

      return notifications;
    },

    async notifyMaintenanceRequestUpdated(request) {
      const recipientUserId = request?.requester?.user?.id;
      if (!recipientUserId) return null;

      const assetName = request.asset?.name || "tài sản";
      const statusLabel = MAINTENANCE_STATUS_LABELS[request.status] || request.status;

      return createAndPublish({
        userId: recipientUserId,
        type: "MAINTENANCE_UPDATED",
        title: "Yêu cầu sửa chữa đã được cập nhật",
        message: `Yêu cầu sửa chữa cho ${assetName} hiện ${statusLabel}.`,
        data: {
          maintenanceRequestId: request.id,
          assetId: request.assetId,
          assetCode: request.asset?.assetCode,
          assetName,
          status: request.status,
          requesterId: request.requesterId,
          targetUrl: `/employee/requests?requestId=${request.id}`,
        },
      });
    },
  });
}

const notificationsService = createNotificationsService();

module.exports = Object.freeze({
  ...notificationsService,
  createNotificationsService,
});
