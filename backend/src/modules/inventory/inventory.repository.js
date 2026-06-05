const defaultPrisma = require("../../config/database");

const INVENTORY_SESSION_SELECT = Object.freeze({
  id: true,
  name: true,
  departmentId: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      assetId: true,
      result: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      asset: { select: { id: true, assetCode: true, name: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  },
});

function createInventoryRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async findSessions(filters = {}) {
      const where = {};
      if (filters.departmentId) where.departmentId = Number(filters.departmentId);
      if (filters.status) where.status = filters.status;

      return prismaClient.inventorySession.findMany({
        where,
        orderBy: { startDate: "desc" },
        select: INVENTORY_SESSION_SELECT,
      });
    },

    async findSessionById(id) {
      return prismaClient.inventorySession.findUnique({ where: { id }, select: INVENTORY_SESSION_SELECT });
    },

    async createSession(data) {
      return prismaClient.inventorySession.create({
        data: {
          name: data.name,
          departmentId: Number(data.departmentId),
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: data.status ?? "DRAFT",
          items: data.assetIds
            ? {
                create: data.assetIds.map((assetId) => ({ assetId })),
              }
            : undefined,
        },
        select: INVENTORY_SESSION_SELECT,
      });
    },

    async updateItem(id, data) {
      return prismaClient.inventoryItem.update({
        where: { id },
        data: {
          result: data.result,
          notes: typeof data.notes === "undefined" ? undefined : data.notes,
        },
        select: {
          id: true,
          sessionId: true,
          assetId: true,
          result: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          asset: { select: { id: true, assetCode: true, name: true, status: true } },
          session: { select: { id: true, name: true, status: true } },
        },
      });
    },

    async findDepartmentById(id) {
      return prismaClient.department.findUnique({ where: { id: Number(id) }, select: { id: true } });
    },

    async countAssetsByIds(assetIds) {
      return prismaClient.asset.count({ where: { id: { in: assetIds } } });
    },

    async findItemById(id) {
      return prismaClient.inventoryItem.findUnique({
        where: { id },
        select: { id: true, session: { select: { status: true } } },
      });
    },
  });
}

const inventoryRepository = createInventoryRepository();

module.exports = Object.freeze({
  ...inventoryRepository,
  createInventoryRepository,
  INVENTORY_SESSION_SELECT,
});
