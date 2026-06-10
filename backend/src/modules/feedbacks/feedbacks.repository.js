const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

function createFeedbackRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async create(data) {
      return activePrisma.feedback.create({
        data: {
          userId: data.userId,
          title: data.title,
          content: data.content,
          category: data.category,
          priority: data.priority || "MEDIUM",
          status: "PENDING",
          fileUrl: data.fileUrl ?? null,
        },
      });
    },

    async update(id, data) {
      return activePrisma.feedback.update({
        where: { id },
        data: {
          status: data.status,
          adminNote: data.adminNote,
        },
      });
    },

    async findById(id) {
      return activePrisma.feedback.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              email: true,
              employee: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });
    },

    async findMany({ search = "", category = "", priority = "", status = "" }) {
      const where = {};

      if (category) {
        where.category = category;
      }

      if (priority) {
        where.priority = priority;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
          { user: { email: { contains: search } } },
        ];
      }

      return activePrisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async findByUserId(userId, { search = "", category = "", status = "" }) {
      const where = { userId };

      if (category) {
        where.category = category;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      return activePrisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    },
  });
}

const feedbackRepository = createFeedbackRepository();

module.exports = Object.freeze({
  ...feedbackRepository,
  createFeedbackRepository,
});
