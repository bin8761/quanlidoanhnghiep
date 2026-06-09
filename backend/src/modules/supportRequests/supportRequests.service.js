const repository = require("./supportRequests.repository");
const notificationsService = require("../notifications/notifications.service");
const logger = require("../../config/logger");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { ADMIN, USER } = require("../../shared/constants/roles");

const TERMINAL_STATUSES = ["COMPLETED", "REJECTED", "CANCELLED"];
const TYPES_REQUIRING_ASSET = ["INCIDENT", "MAINTENANCE", "EXCHANGE", "RECALL"];
const REPAIR_TYPES = ["INCIDENT", "MAINTENANCE"];

function requestError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function forbiddenError(message = "Forbidden") {
  return new AppError({ message, statusCode: 403, errorCode: ERROR_CODES.AUTH_FORBIDDEN });
}

async function resolveRequester({ supportRepository, authenticatedUser, requestedRequesterId }) {
  if (authenticatedUser?.role === ADMIN) {
    if (!requestedRequesterId) throw requestError("Requester ID is required");
    return requestedRequesterId;
  }

  if (authenticatedUser?.role !== USER) throw forbiddenError();

  const employee = await supportRepository.findEmployeeByUserId(authenticatedUser.userId);
  if (!employee) throw forbiddenError("Authenticated user is not linked to an employee");
  if (employee.status !== "ACTIVE") throw requestError("Requester is not active");
  if (requestedRequesterId && requestedRequesterId !== employee.id) {
    throw forbiddenError("Users can only manage their own support requests");
  }

  return employee.id;
}

function ensureResolution(status, resolution) {
  if (["COMPLETED", "REJECTED", "CANCELLED"].includes(status) && !String(resolution || "").trim()) {
    throw requestError("Resolution is required for completed, rejected, or cancelled requests");
  }
}

function wrapWorkflowError(error) {
  if (error instanceof AppError) throw error;
  throw requestError(error.message || "Support request workflow failed");
}

function createSupportRequestsService({ supportRepository = repository, notifications = notificationsService } = {}) {
  async function notifyCreated(request) {
    try {
      await notifications.notifySupportRequestCreated(request);
    } catch (error) {
      logger.error({ err: error, requestId: request.id }, "Failed to publish support request notification");
    }
  }

  async function notifyUpdated(request) {
    try {
      await notifications.notifySupportRequestUpdated(request);
    } catch (error) {
      logger.error({ err: error, requestId: request.id }, "Failed to publish support request update notification");
    }
  }

  async function syncSupportRequestTask(request) {
    try {
      const tasksService = require("../tasks/tasks.service");
      const requesterUserId = request?.requester?.user?.id;
      if (!requesterUserId) return;

      if (request.status === "WAITING_USER") {
        await tasksService.createTask({
          userId: requesterUserId,
          type: "MAINTENANCE_FEEDBACK",
          title: `Cần phản hồi yêu cầu hỗ trợ ${request.asset?.name || "thiết bị"}`,
          description: `Yêu cầu hỗ trợ của bạn cần được bổ sung thông tin: ${request.notes || ""}`,
          priority: "MEDIUM",
          actionUrl: `/employee/requests?requestId=${request.id}`,
          referenceId: request.id,
        });
      } else {
        await tasksService.completeTask(requesterUserId, "MAINTENANCE_FEEDBACK", request.id);
      }
    } catch (error) {
      logger.error({ err: error, requestId: request.id }, "Failed to sync user task for support request");
    }
  }

  return Object.freeze({
    async getAll(filters = {}, context = {}) {
      if (context.authenticatedUser?.role === ADMIN) {
        return supportRepository.findAll(filters);
      }

      const requesterId = await resolveRequester({
        supportRepository,
        authenticatedUser: context.authenticatedUser,
        requestedRequesterId: filters.requesterId,
      });

      return supportRepository.findAll({ ...filters, requesterId });
    },

    async getById(id, context = {}) {
      const request = await supportRepository.findById(id);
      if (!request) throw requestError("Support request not found", 404);
      if (context.authenticatedUser?.role !== ADMIN) {
        const requesterId = await resolveRequester({
          supportRepository,
          authenticatedUser: context.authenticatedUser,
          requestedRequesterId: request.requesterId,
        });
        if (request.requesterId !== requesterId) throw forbiddenError("Users can only view their own support requests");
      }
      return request;
    },

    async create(data, context = {}) {
      const requesterId = await resolveRequester({
        supportRepository,
        authenticatedUser: context.authenticatedUser,
        requestedRequesterId: data.requesterId,
      });

      const requester = await supportRepository.findEmployeeById(requesterId);
      if (!requester) throw requestError("Requester not found", 404);
      if (requester.status !== "ACTIVE") throw requestError("Requester is not active");

      if (TYPES_REQUIRING_ASSET.includes(data.type) && !data.assetId) {
        throw requestError(`Asset ID is required for request type ${data.type}`);
      }

      if (data.assetId) {
        const asset = await supportRepository.findAssetById(data.assetId);
        if (!asset) throw requestError("Asset not found", 404);
        if (["LOST", "DISPOSED"].includes(asset.status)) {
          throw requestError("Cannot create support request for unavailable asset status");
        }

        if (context.authenticatedUser?.role === USER) {
          const assignedToRequester = await supportRepository.hasActiveAssignment(data.assetId, requesterId);
          if (!assignedToRequester) throw forbiddenError("Users can only request support for assigned assets");
        }
      }

      const request = await supportRepository.create(
        {
          ...data,
          priority: data.priority || "MEDIUM",
          requesterId,
        },
        { actorUserId: context.authenticatedUser?.userId },
      );

      await notifyCreated(request);
      return request;
    },

    async updateStatus(id, data, context = {}) {
      const request = await supportRepository.findById(id);
      if (!request) throw requestError("Support request not found", 404);
      if (TERMINAL_STATUSES.includes(request.status)) throw requestError("Closed support requests cannot be updated");
      ensureResolution(data.status, data.resolution);

      const updated = await supportRepository.updateStatus(
        id,
        data,
        { actorUserId: context.authenticatedUser?.userId },
      );

      await notifyUpdated(updated);
      await syncSupportRequestTask(updated);
      return updated;
    },

    async fulfill(id, data, context = {}) {
      const request = await supportRepository.findById(id);
      if (!request) throw requestError("Support request not found", 404);
      if (TERMINAL_STATUSES.includes(request.status)) throw requestError("Closed support requests cannot be fulfilled");
      if (!String(data.resolution || "").trim()) throw requestError("Resolution is required");

      if (REPAIR_TYPES.includes(request.type) && request.assetId && !data.assetStatus) {
        throw requestError("Final asset status is required for repair requests");
      }
      if (request.type === "NEW_ALLOCATION" && !data.assetId) {
        throw requestError("Asset ID is required to fulfill new allocation requests");
      }
      if (request.type === "EXCHANGE" && !data.replacementAssetId) {
        throw requestError("Replacement asset ID is required to fulfill exchange requests");
      }

      try {
        const updated = await supportRepository.fulfill(
          id,
          data,
          { actorUserId: context.authenticatedUser?.userId },
        );
        await notifyUpdated(updated);
        await syncSupportRequestTask(updated);
        return updated;
      } catch (error) {
        wrapWorkflowError(error);
      }
    },
  });
}

const service = createSupportRequestsService();

module.exports = Object.freeze({
  ...service,
  createSupportRequestsService,
  TYPES_REQUIRING_ASSET,
});
