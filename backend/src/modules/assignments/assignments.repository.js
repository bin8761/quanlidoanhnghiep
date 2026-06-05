const defaultPrisma = require("../../config/database");

const ASSIGNMENT_SELECT = Object.freeze({
  id: true,
  assetId: true,
  employeeId: true,
  assignedAt: true,
  returnedAt: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  asset: {
    select: {
      id: true,
      assetCode: true,
      name: true,
      status: true,
      category: { select: { id: true, name: true } },
    },
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  },
});

function createAssignmentsRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async findHistory(filters = {}) {
      const where = {};
      if (filters.assetId) where.assetId = filters.assetId;
      if (filters.employeeId) where.employeeId = filters.employeeId;
      if (filters.status) where.status = filters.status;

      return prismaClient.assetAssignment.findMany({
        where,
        orderBy: { assignedAt: "desc" },
        select: ASSIGNMENT_SELECT,
      });
    },

    async assignAsset(data) {
      return prismaClient.$transaction(async (tx) => {
        const assignment = await tx.assetAssignment.create({
          data: {
            assetId: data.assetId,
            employeeId: data.employeeId,
            assignedAt: data.assignedAt ? new Date(data.assignedAt) : new Date(),
            notes: data.notes ?? null,
          },
          select: ASSIGNMENT_SELECT,
        });

        await tx.asset.update({
          where: { id: data.assetId },
          data: { status: "ASSIGNED" },
        });

        return assignment;
      });
    },

    async returnAsset(activeAssignmentId, data = {}) {
      return prismaClient.$transaction(async (tx) => {
        const assignment = await tx.assetAssignment.update({
          where: { id: activeAssignmentId },
          data: {
            status: "RETURNED",
            returnedAt: data.returnedAt ? new Date(data.returnedAt) : new Date(),
            notes: data.notes ?? undefined,
          },
          select: ASSIGNMENT_SELECT,
        });

        await tx.asset.update({
          where: { id: assignment.assetId },
          data: { status: data.assetStatus ?? "AVAILABLE" },
        });

        return assignment;
      });
    },

    async transferAsset(activeAssignmentId, data) {
      return prismaClient.$transaction(async (tx) => {
        const closedAssignment = await tx.assetAssignment.update({
          where: { id: activeAssignmentId },
          data: {
            status: "TRANSFERRED",
            returnedAt: data.transferredAt ? new Date(data.transferredAt) : new Date(),
            notes: data.notes ?? undefined,
          },
          select: ASSIGNMENT_SELECT,
        });

        return tx.assetAssignment.create({
          data: {
            assetId: closedAssignment.assetId,
            employeeId: data.toEmployeeId,
            assignedAt: data.transferredAt ? new Date(data.transferredAt) : new Date(),
            notes: data.notes ?? null,
          },
          select: ASSIGNMENT_SELECT,
        });
      });
    },

    async findAssetById(id) {
      return prismaClient.asset.findUnique({ where: { id }, select: { id: true, status: true } });
    },

    async findEmployeeById(id) {
      return prismaClient.employee.findUnique({ where: { id }, select: { id: true, status: true } });
    },

    async findActiveAssignmentByAssetId(assetId) {
      return prismaClient.assetAssignment.findFirst({
        where: { assetId, status: "ACTIVE" },
        select: ASSIGNMENT_SELECT,
      });
    },
  });
}

const assignmentsRepository = createAssignmentsRepository();

module.exports = Object.freeze({
  ...assignmentsRepository,
  createAssignmentsRepository,
  ASSIGNMENT_SELECT,
});
