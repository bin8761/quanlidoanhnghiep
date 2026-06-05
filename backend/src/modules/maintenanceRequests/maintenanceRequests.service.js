const repository = require("./maintenanceRequests.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { ADMIN, USER } = require("../../shared/constants/roles");

function requestError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function assetStatusForMaintenance(status) {
  if (status === "IN_PROGRESS") return "MAINTENANCE";
  if (status === "COMPLETED") return "AVAILABLE";
  if (status === "CANCELLED") return "AVAILABLE";
  return undefined;
}

function forbiddenError(message = "Forbidden") {
  return new AppError({ message, statusCode: 403, errorCode: ERROR_CODES.AUTH_FORBIDDEN });
}

async function resolveRequester({ maintenanceRepository, authenticatedUser, requestedRequesterId }) {
  if (authenticatedUser?.role === ADMIN) {
    if (!requestedRequesterId) throw requestError("Requester ID is required");
    return requestedRequesterId;
  }

  if (authenticatedUser?.role !== USER) {
    throw forbiddenError();
  }

  const employee = await maintenanceRepository.findEmployeeByUserId(authenticatedUser.userId);
  if (!employee) throw forbiddenError("Authenticated user is not linked to an employee");
  if (employee.status !== "ACTIVE") throw requestError("Requester is not active");

  if (requestedRequesterId && requestedRequesterId !== employee.id) {
    throw forbiddenError("Users can only manage their own maintenance requests");
  }

  return employee.id;
}

function createMaintenanceRequestsService({ maintenanceRepository = repository } = {}) {
  return Object.freeze({
    async getAll(filters = {}, context = {}) {
      const requesterId = await resolveRequester({
        maintenanceRepository,
        authenticatedUser: context.authenticatedUser,
        requestedRequesterId: filters.requesterId,
      });

      return maintenanceRepository.findAll({
        ...filters,
        requesterId,
      });
    },

    async getById(id, context = {}) {
      const request = await maintenanceRepository.findById(id);
      if (!request) throw requestError("Maintenance request not found", 404);
      if (context.authenticatedUser?.role !== ADMIN) {
        const requesterId = await resolveRequester({
          maintenanceRepository,
          authenticatedUser: context.authenticatedUser,
          requestedRequesterId: request.requesterId,
        });
        if (request.requesterId !== requesterId) throw forbiddenError("Users can only view their own maintenance requests");
      }
      return request;
    },

    async create(data, context = {}) {
      const requesterId = await resolveRequester({
        maintenanceRepository,
        authenticatedUser: context.authenticatedUser,
        requestedRequesterId: data.requesterId,
      });

      const asset = await maintenanceRepository.findAssetById(data.assetId);
      if (!asset) throw requestError("Asset not found", 404);
      if (["LOST", "DISPOSED"].includes(asset.status)) throw requestError("Cannot create maintenance request for unavailable asset status");

      const requester = await maintenanceRepository.findEmployeeById(requesterId);
      if (!requester) throw requestError("Requester not found", 404);
      if (requester.status !== "ACTIVE") throw requestError("Requester is not active");

      if (context.authenticatedUser?.role === USER) {
        const assignedToRequester = await maintenanceRepository.hasActiveAssignment(data.assetId, requesterId);
        if (!assignedToRequester) throw forbiddenError("Users can only request maintenance for assigned assets");
      }

      return maintenanceRepository.create({
        ...data,
        requesterId,
      });
    },

    async updateStatus(id, data) {
      const request = await maintenanceRepository.findById(id);
      if (!request) throw requestError("Maintenance request not found", 404);
      if (["COMPLETED", "CANCELLED"].includes(request.status)) throw requestError("Completed or cancelled maintenance requests cannot be updated");

      let nextAssetStatus = data.assetStatus ?? assetStatusForMaintenance(data.status);
      if (["COMPLETED", "CANCELLED"].includes(data.status)) {
        const activeAssignment = await maintenanceRepository.hasActiveAssignment(request.assetId, request.requesterId);
        if (activeAssignment && nextAssetStatus === "AVAILABLE") {
          nextAssetStatus = "ASSIGNED";
        }
      }

      return maintenanceRepository.updateStatus(id, {
        ...data,
        assetStatus: nextAssetStatus,
      });
    },
  });
}

const service = createMaintenanceRequestsService();

module.exports = Object.freeze({
  ...service,
  createMaintenanceRequestsService,
});
