const defaultPrisma = require("../../config/database");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function workflowError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

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
    async findEmployeeByUserId(userId) {
      return prismaClient.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true, fullName: true, employeeCode: true },
      });
    },

    async findMyAssignments(employeeId) {
      return prismaClient.assetAssignment.findMany({
        where: {
          employeeId,
          status: "ACTIVE",
        },
        orderBy: { assignedAt: "desc" },
        select: ASSIGNMENT_SELECT,
      });
    },

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
        const assetUpdate = await tx.asset.updateMany({
          where: { id: data.assetId, status: "AVAILABLE" },
          data: { status: "ASSIGNED" },
        });

        if (assetUpdate.count !== 1) {
          throw workflowError("Only AVAILABLE assets can be assigned");
        }

        const activeAssignmentCount = await tx.assetAssignment.count({
          where: { assetId: data.assetId, status: "ACTIVE" },
        });

        if (activeAssignmentCount > 0) {
          throw workflowError("Asset already has an active assignment");
        }

        const assignment = await tx.assetAssignment.create({
          data: {
            assetId: data.assetId,
            employeeId: data.employeeId,
            assignedAt: data.assignedAt ? new Date(data.assignedAt) : new Date(),
            notes: data.notes ?? null,
          },
          select: ASSIGNMENT_SELECT,
        });

        return assignment;
      });
    },

    async returnAsset(activeAssignmentId, data = {}) {
      return prismaClient.$transaction(async (tx) => {
        const activeAssignment = await tx.assetAssignment.findUnique({
          where: { id: activeAssignmentId },
          select: { id: true, assetId: true, status: true },
        });

        if (!activeAssignment || activeAssignment.status !== "ACTIVE") {
          throw workflowError("Active assignment not found for asset", 404);
        }

        const updateResult = await tx.assetAssignment.updateMany({
          where: { id: activeAssignmentId, status: "ACTIVE" },
          data: {
            status: "RETURNED",
            returnedAt: data.returnedAt ? new Date(data.returnedAt) : new Date(),
            notes: data.notes ?? undefined,
          },
        });

        if (updateResult.count !== 1) {
          throw workflowError("Active assignment not found for asset", 404);
        }

        const assignment = await tx.assetAssignment.findUnique({
          where: { id: activeAssignmentId },
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
        const activeAssignment = await tx.assetAssignment.findUnique({
          where: { id: activeAssignmentId },
          select: { id: true, assetId: true, status: true },
        });

        if (!activeAssignment || activeAssignment.status !== "ACTIVE") {
          throw workflowError("Active assignment not found for asset", 404);
        }

        const updateResult = await tx.assetAssignment.updateMany({
          where: { id: activeAssignmentId, status: "ACTIVE" },
          data: {
            status: "TRANSFERRED",
            returnedAt: data.transferredAt ? new Date(data.transferredAt) : new Date(),
            notes: data.notes ?? undefined,
          },
        });

        if (updateResult.count !== 1) {
          throw workflowError("Active assignment not found for asset", 404);
        }

        return tx.assetAssignment.create({
          data: {
            assetId: activeAssignment.assetId,
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
