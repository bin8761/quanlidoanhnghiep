const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

function createLoginHistoryRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async create(data) {
      return activePrisma.loginHistory.create({
        data: {
          userId: data.userId,
          ipAddress: data.ipAddress ?? null,
          device: data.device ?? null,
          browser: data.browser ?? null,
          os: data.os ?? null,
          status: data.status ?? "SUCCESS",
        },
      });
    },

    async update(id, data) {
      return activePrisma.loginHistory.update({
        where: { id },
        data: {
          logoutAt: data.logoutAt,
        },
      });
    },

    async findLatestActiveSession(userId) {
      return activePrisma.loginHistory.findFirst({
        where: {
          userId,
          logoutAt: null,
          status: "SUCCESS",
        },
        orderBy: {
          loginAt: "desc",
        },
      });
    },

    async findMany({ page = 1, pageSize = 10, search = "", status = "" }) {
      const skip = (page - 1) * pageSize;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { user: { email: { contains: search } } },
          { ipAddress: { contains: search } },
          { browser: { contains: search } },
          { os: { contains: search } },
          { device: { contains: search } },
        ];
      }

      const [items, totalCount] = await Promise.all([
        activePrisma.loginHistory.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                employee: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            loginAt: "desc",
          },
          skip,
          take: pageSize,
        }),
        activePrisma.loginHistory.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      };
    },

    async findByUserId(userId, { page = 1, pageSize = 10 }) {
      const skip = (page - 1) * pageSize;
      const where = { userId };

      const [items, totalCount] = await Promise.all([
        activePrisma.loginHistory.findMany({
          where,
          orderBy: {
            loginAt: "desc",
          },
          skip,
          take: pageSize,
        }),
        activePrisma.loginHistory.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      };
    },
  });
}

const loginHistoryRepository = createLoginHistoryRepository();

module.exports = Object.freeze({
  ...loginHistoryRepository,
  createLoginHistoryRepository,
});
