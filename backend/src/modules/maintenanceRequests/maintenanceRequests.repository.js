const defaultPrisma = require("../../config/database");

const MAINTENANCE_SELECT = Object.freeze({
  id: true,
  type: true,
  assetId: true,
  requesterId: true,
  description: true,
  status: true,
  repairCost: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  asset: { select: { id: true, assetCode: true, name: true, status: true } },
  requester: { select: { id: true, employeeCode: true, fullName: true, departmentId: true } },
});

function createMaintenanceRequestsRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async findAll(filters = {}) {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.assetId) where.assetId = filters.assetId;
      if (filters.requesterId) where.requesterId = filters.requesterId;

      return prismaClient.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: MAINTENANCE_SELECT,
      });
    },

    async findById(id) {
      return prismaClient.maintenanceRequest.findUnique({ where: { id }, select: MAINTENANCE_SELECT });
    },

    async create(data) {
      return prismaClient.maintenanceRequest.create({
        data: {
          type: data.type,
          assetId: data.assetId || null,
          requesterId: data.requesterId,
          description: data.description,
          notes: data.notes ?? null,
        },
        select: MAINTENANCE_SELECT,
      });
    },

    async updateStatus(id, data) {
      return prismaClient.$transaction(async (tx) => {
        const request = await tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: data.status,
            repairCost: typeof data.repairCost === "undefined" ? undefined : data.repairCost,
            notes: typeof data.notes === "undefined" ? undefined : data.notes,
          },
          select: MAINTENANCE_SELECT,
        });

        if (data.assetStatus && request.assetId) {
          await tx.asset.update({
            where: { id: request.assetId },
            data: { status: data.assetStatus },
          });
        }

        return request;
      });
    },

    async findAssetById(id) {
      return prismaClient.asset.findUnique({ where: { id }, select: { id: true, status: true } });
    },

    async findEmployeeById(id) {
      return prismaClient.employee.findUnique({ where: { id }, select: { id: true, status: true } });
    },

    async findEmployeeByUserId(userId) {
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
          employee: {
            select: { id: true, status: true },
          },
        },
      });

      return user?.employee ?? null;
    },

    async hasActiveAssignment(assetId, employeeId) {
      const count = await prismaClient.assetAssignment.count({
        where: {
          assetId,
          employeeId,
          status: "ACTIVE",
        },
      });

      return count > 0;
    },
  });
}

const maintenanceRequestsRepository = createMaintenanceRequestsRepository();

module.exports = Object.freeze({
  ...maintenanceRequestsRepository,
  createMaintenanceRequestsRepository,
  MAINTENANCE_SELECT,
});
