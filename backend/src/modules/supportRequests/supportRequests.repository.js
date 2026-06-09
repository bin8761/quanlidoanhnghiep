const defaultPrisma = require("../../config/database");

const SUPPORT_REQUEST_SELECT = Object.freeze({
  id: true,
  type: true,
  priority: true,
  assetId: true,
  requesterId: true,
  assigneeId: true,
  approvedById: true,
  description: true,
  status: true,
  repairCost: true,
  notes: true,
  resolution: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  asset: { select: { id: true, assetCode: true, name: true, status: true } },
  requester: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      departmentId: true,
      user: { select: { id: true } },
    },
  },
  assignee: {
    select: {
      id: true,
      email: true,
      employee: { select: { id: true, employeeCode: true, fullName: true } },
    },
  },
  approvedBy: {
    select: {
      id: true,
      email: true,
      employee: { select: { id: true, employeeCode: true, fullName: true } },
    },
  },
  events: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      actorUserId: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          email: true,
          employee: { select: { id: true, employeeCode: true, fullName: true } },
        },
      },
    },
  },
});

const ASSIGNMENT_SELECT = Object.freeze({
  id: true,
  assetId: true,
  employeeId: true,
  assignedAt: true,
  returnedAt: true,
  status: true,
  notes: true,
  asset: { select: { id: true, assetCode: true, name: true, status: true } },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      user: { select: { id: true } },
    },
  },
});

async function addEvent(tx, requestId, event) {
  if (!tx.supportRequestEvent?.create) return null;
  return tx.supportRequestEvent.create({
    data: {
      supportRequestId: requestId,
      actorUserId: event.actorUserId ?? null,
      type: event.type,
      message: event.message,
      metadata: event.metadata ?? undefined,
    },
  });
}

function runTransaction(prismaClient, callback) {
  if (typeof prismaClient.$transaction === "function") {
    return prismaClient.$transaction(callback);
  }
  return callback(prismaClient);
}

function requestModel(client) {
  return client.supportRequest || client.maintenanceRequest;
}

async function findActiveAssignment(tx, assetId) {
  return tx.assetAssignment.findFirst({
    where: { assetId, status: "ACTIVE" },
    select: ASSIGNMENT_SELECT,
  });
}

async function assignAsset(tx, { assetId, employeeId, notes, actorUserId, requestId }) {
  const assetUpdate = await tx.asset.updateMany({
    where: { id: assetId, status: "AVAILABLE" },
    data: { status: "ASSIGNED" },
  });
  if (assetUpdate.count !== 1) {
    throw new Error("Only AVAILABLE assets can be assigned");
  }

  const activeAssignmentCount = await tx.assetAssignment.count({
    where: { assetId, status: "ACTIVE" },
  });
  if (activeAssignmentCount > 0) {
    throw new Error("Asset already has an active assignment");
  }

  const assignment = await tx.assetAssignment.create({
    data: {
      assetId,
      employeeId,
      notes: notes ?? null,
    },
    select: ASSIGNMENT_SELECT,
  });

  await addEvent(tx, requestId, {
    actorUserId,
    type: "ASSIGNMENT_CREATED",
    message: `Asset ${assignment.asset?.assetCode || assetId} assigned to ${assignment.employee?.fullName || employeeId}.`,
    metadata: { assignmentId: assignment.id, assetId, employeeId },
  });

  return assignment;
}

async function returnActiveAsset(tx, { assetId, assetStatus = "AVAILABLE", notes, actorUserId, requestId, eventType = "ASSIGNMENT_RETURNED" }) {
  const activeAssignment = await findActiveAssignment(tx, assetId);
  if (!activeAssignment) throw new Error("Active assignment not found for asset");

  await tx.assetAssignment.updateMany({
    where: { id: activeAssignment.id, status: "ACTIVE" },
    data: {
      status: eventType === "ASSIGNMENT_TRANSFERRED" ? "TRANSFERRED" : "RETURNED",
      returnedAt: new Date(),
      notes: notes ?? undefined,
    },
  });
  await tx.asset.update({ where: { id: assetId }, data: { status: assetStatus } });

  await addEvent(tx, requestId, {
    actorUserId,
    type: eventType,
    message: `Asset ${activeAssignment.asset?.assetCode || assetId} returned from ${activeAssignment.employee?.fullName || activeAssignment.employeeId}.`,
    metadata: { assignmentId: activeAssignment.id, assetId, assetStatus },
  });

  return activeAssignment;
}

function createSupportRequestsRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async findAll(filters = {}) {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assetId) where.assetId = filters.assetId;
      if (filters.requesterId) where.requesterId = filters.requesterId;
      if (filters.assigneeId) where.assigneeId = filters.assigneeId;

      return requestModel(prismaClient).findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: SUPPORT_REQUEST_SELECT,
      });
    },

    async findById(id) {
      return requestModel(prismaClient).findUnique({ where: { id }, select: SUPPORT_REQUEST_SELECT });
    },

    async create(data, event) {
      return runTransaction(prismaClient, async (tx) => {
        if (data.type === "INCIDENT" && data.assetId) {
          await tx.asset.update({
            where: { id: data.assetId },
            data: { status: "BROKEN" },
          });
        }

        const request = await requestModel(tx).create({
          data: {
            type: data.type,
            priority: data.priority,
            assetId: data.assetId || null,
            requesterId: data.requesterId,
            description: data.description,
            notes: data.notes ?? null,
          },
          select: SUPPORT_REQUEST_SELECT,
        });

        await addEvent(tx, request.id, {
          actorUserId: event.actorUserId,
          type: "CREATED",
          message: "Support request created.",
          metadata: { type: data.type, priority: data.priority, assetId: data.assetId || null },
        });

        if (data.type === "INCIDENT" && data.assetId) {
          await addEvent(tx, request.id, {
            actorUserId: event.actorUserId,
            type: "ASSET_STATUS_CHANGED",
            message: "Asset marked as broken after incident report.",
            metadata: { assetId: data.assetId, assetStatus: "BROKEN" },
          });
        }

        if (requestModel(tx).findUnique) {
          const hydratedRequest = await requestModel(tx).findUnique({ where: { id: request.id }, select: SUPPORT_REQUEST_SELECT });
          return hydratedRequest || request;
        }
        return request;
      });
    },

    async updateStatus(id, data, event) {
      return runTransaction(prismaClient, async (tx) => {
        const updateData = {
          status: data.status,
          notes: typeof data.notes === "undefined" ? undefined : data.notes,
          resolution: typeof data.resolution === "undefined" ? undefined : data.resolution,
        };

        if (data.status === "APPROVED") updateData.approvedById = event.actorUserId;
        if (data.status === "IN_PROGRESS") updateData.assigneeId = data.assigneeId || event.actorUserId;
        if (data.status === "COMPLETED") updateData.completedAt = new Date();
        if (data.status === "CANCELLED") updateData.cancelledAt = new Date();

        const request = await requestModel(tx).update({
          where: { id },
          data: updateData,
          select: SUPPORT_REQUEST_SELECT,
        });

        if (data.status === "IN_PROGRESS" && ["INCIDENT", "MAINTENANCE"].includes(request.type) && request.assetId) {
          await tx.asset.update({ where: { id: request.assetId }, data: { status: "MAINTENANCE" } });
          await addEvent(tx, id, {
            actorUserId: event.actorUserId,
            type: "ASSET_STATUS_CHANGED",
            message: "Asset moved to maintenance.",
            metadata: { assetId: request.assetId, assetStatus: "MAINTENANCE" },
          });
        }

        await addEvent(tx, id, {
          actorUserId: event.actorUserId,
          type: data.status === "APPROVED" ? "APPROVED" : data.status === "REJECTED" ? "REJECTED" : data.status === "CANCELLED" ? "CANCELLED" : data.status === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGED",
          message: `Support request status changed to ${data.status}.`,
          metadata: { status: data.status, assigneeId: data.assigneeId || null },
        });

        return requestModel(tx).findUnique({ where: { id }, select: SUPPORT_REQUEST_SELECT });
      });
    },

    async fulfill(id, data, event) {
      return runTransaction(prismaClient, async (tx) => {
        const request = await requestModel(tx).findUnique({
          where: { id },
          select: SUPPORT_REQUEST_SELECT,
        });
        if (!request) return null;

        if (["INCIDENT", "MAINTENANCE"].includes(request.type) && request.assetId) {
          let nextAssetStatus = data.assetStatus || "AVAILABLE";
          const activeAssignment = await findActiveAssignment(tx, request.assetId);
          if (activeAssignment && nextAssetStatus === "AVAILABLE") nextAssetStatus = "ASSIGNED";
          await tx.asset.update({ where: { id: request.assetId }, data: { status: nextAssetStatus } });
          await addEvent(tx, id, {
            actorUserId: event.actorUserId,
            type: "ASSET_STATUS_CHANGED",
            message: `Asset status changed to ${nextAssetStatus}.`,
            metadata: { assetId: request.assetId, assetStatus: nextAssetStatus },
          });
        }

        if (request.type === "NEW_ALLOCATION") {
          await assignAsset(tx, {
            assetId: data.assetId,
            employeeId: request.requesterId,
            notes: data.resolution,
            actorUserId: event.actorUserId,
            requestId: id,
          });
        }

        if (request.type === "EXCHANGE") {
          await returnActiveAsset(tx, {
            assetId: request.assetId,
            assetStatus: data.returnedAssetStatus || "AVAILABLE",
            notes: data.resolution,
            actorUserId: event.actorUserId,
            requestId: id,
            eventType: "ASSIGNMENT_TRANSFERRED",
          });
          await assignAsset(tx, {
            assetId: data.replacementAssetId,
            employeeId: request.requesterId,
            notes: data.resolution,
            actorUserId: event.actorUserId,
            requestId: id,
          });
        }

        if (request.type === "RECALL") {
          await returnActiveAsset(tx, {
            assetId: request.assetId,
            assetStatus: data.assetStatus || "AVAILABLE",
            notes: data.resolution,
            actorUserId: event.actorUserId,
            requestId: id,
          });
        }

        await requestModel(tx).update({
          where: { id },
          data: {
            status: "COMPLETED",
            repairCost: typeof data.repairCost === "undefined" ? undefined : data.repairCost,
            resolution: data.resolution,
            notes: typeof data.notes === "undefined" ? undefined : data.notes,
            assigneeId: data.assigneeId || event.actorUserId,
            completedAt: new Date(),
          },
        });

        await addEvent(tx, id, {
          actorUserId: event.actorUserId,
          type: "COMPLETED",
          message: "Support request fulfilled and completed.",
          metadata: { type: request.type },
        });

        return requestModel(tx).findUnique({ where: { id }, select: SUPPORT_REQUEST_SELECT });
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
          employeeId: true,
          employee: { select: { id: true, status: true } },
        },
      });
      if (user?.employee) return user.employee;
      if (user?.employeeId) {
        return prismaClient.employee.findUnique({
          where: { id: user.employeeId },
          select: { id: true, status: true },
        });
      }
      return null;
    },

    async hasActiveAssignment(assetId, employeeId) {
      const count = await prismaClient.assetAssignment.count({
        where: { assetId, employeeId, status: "ACTIVE" },
      });
      return count > 0;
    },
  });
}

const supportRequestsRepository = createSupportRequestsRepository();

module.exports = Object.freeze({
  ...supportRequestsRepository,
  createSupportRequestsRepository,
  SUPPORT_REQUEST_SELECT,
});
