const defaultPrisma = require("../../config/database");

const NOTIFICATION_SELECT = Object.freeze({
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  data: true,
  readAt: true,
  createdAt: true,
});

function createNotificationsRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async create(data) {
      return prismaClient.notification.create({
        data,
        select: NOTIFICATION_SELECT,
      });
    },

    async findForUser(userId, { limit = 20, unreadOnly = false } = {}) {
      return prismaClient.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: NOTIFICATION_SELECT,
      });
    },

    async countUnread(userId) {
      return prismaClient.notification.count({
        where: { userId, readAt: null },
      });
    },

    async markAsRead(userId, id) {
      const update = await prismaClient.notification.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      });

      if (update.count === 0) {
        return prismaClient.notification.findFirst({
          where: { id, userId },
          select: NOTIFICATION_SELECT,
        });
      }

      return prismaClient.notification.findFirst({
        where: { id, userId },
        select: NOTIFICATION_SELECT,
      });
    },

    async markAllAsRead(userId) {
      return prismaClient.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    },

    async findActiveUsersByRole(role) {
      return prismaClient.user.findMany({
        where: { role, isActive: true },
        select: { id: true },
      });
    },
  });
}

const notificationsRepository = createNotificationsRepository();

module.exports = Object.freeze({
  ...notificationsRepository,
  createNotificationsRepository,
  NOTIFICATION_SELECT,
});
