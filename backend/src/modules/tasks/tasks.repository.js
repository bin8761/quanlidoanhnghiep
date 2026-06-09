const defaultPrisma = require("../../config/database");

function createTasksRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async findForUser(userId, filters = {}) {
      const where = { userId };
      
      if (typeof filters.status !== "undefined") {
        where.status = filters.status;
      } else {
        // By default retrieve only pending/overdue tasks
        where.status = { in: ["PENDING", "OVERDUE"] };
      }

      if (filters.type) {
        where.type = filters.type;
      }

      return prismaClient.userTask.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ],
      });
    },

    async findById(id) {
      return prismaClient.userTask.findUnique({
        where: { id },
      });
    },

    async create(data) {
      return prismaClient.userTask.create({
        data,
      });
    },

    async update(id, data) {
      return prismaClient.userTask.update({
        where: { id },
        data,
      });
    },

    async findPendingTask(userId, type, referenceId) {
      return prismaClient.userTask.findFirst({
        where: {
          userId,
          type,
          referenceId,
          status: "PENDING",
        },
      });
    },

    async completePendingTask(userId, type, referenceId) {
      return prismaClient.userTask.updateMany({
        where: {
          userId,
          type,
          referenceId,
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    },

    async cancelPendingTask(userId, type, referenceId) {
      return prismaClient.userTask.updateMany({
        where: {
          userId,
          type,
          referenceId,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });
    }
  });
}

const tasksRepository = createTasksRepository();

module.exports = Object.freeze({
  ...tasksRepository,
  createTasksRepository,
});
