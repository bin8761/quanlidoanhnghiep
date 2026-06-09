const notificationsRepository = require("./notifications.repository");
const sseHub = require("./notifications.sse");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { ADMIN } = require("../../shared/constants/roles");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const STATUS_LABELS = Object.freeze({
  PENDING: "cho xu ly",
  APPROVED: "da duyet",
  IN_PROGRESS: "dang xu ly",
  WAITING_USER: "dang cho bo sung",
  COMPLETED: "hoan tat",
  REJECTED: "bi tu choi",
  CANCELLED: "da huy",
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
  return { ...notification, isRead: Boolean(notification.readAt) };
}

function createNotificationsService({ repository = notificationsRepository, realtime = sseHub } = {}) {
  async function createAndPublish(data) {
    const notification = await repository.create(data);
    const normalized = normalizeNotification(notification);
    realtime.sendToUser(notification.userId, normalized);
    return normalized;
  }

  const service = {
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
        title: "Ban vua duoc ban giao tai san",
        message: `${assignment.asset?.name || "Tai san"} da duoc ban giao cho ban.`,
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

    async notifySupportRequestCreated(request) {
      const admins = await repository.findActiveUsersByRole(ADMIN);
      if (!admins.length) return [];
      const notifications = [];
      const assetName = request.asset?.name || "khong lien ket tai san";
      const requesterName = request.requester?.fullName || "Nhan vien";

      for (const admin of admins) {
        const notification = await createAndPublish({
          userId: admin.id,
          type: "MAINTENANCE_CREATED",
          title: "Co yeu cau ho tro moi",
          message: `${requesterName} vua gui yeu cau ${request.type} cho ${assetName}.`,
          data: {
            supportRequestId: request.id,
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

    async notifySupportRequestUpdated(request) {
      const recipientUserId = request?.requester?.user?.id;
      if (!recipientUserId) return null;
      const assetName = request.asset?.name || "yeu cau";
      const statusLabel = STATUS_LABELS[request.status] || request.status;
      return createAndPublish({
        userId: recipientUserId,
        type: "MAINTENANCE_UPDATED",
        title: "Yeu cau ho tro da duoc cap nhat",
        message: `Yeu cau ho tro ${assetName} hien ${statusLabel}.`,
        data: {
          supportRequestId: request.id,
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
  };

  service.notifyMaintenanceRequestCreated = service.notifySupportRequestCreated;
  service.notifyMaintenanceRequestUpdated = service.notifySupportRequestUpdated;

  return Object.freeze(service);
}

const notificationsService = createNotificationsService();

module.exports = Object.freeze({
  ...notificationsService,
  createNotificationsService,
});
