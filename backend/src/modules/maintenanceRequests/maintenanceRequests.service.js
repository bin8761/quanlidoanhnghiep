const repository = require("./maintenanceRequests.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function requestError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function assetStatusForMaintenance(status) {
  if (status === "IN_PROGRESS") return "MAINTENANCE";
  if (status === "COMPLETED") return "AVAILABLE";
  if (status === "CANCELLED") return "AVAILABLE";
  return undefined;
}

function createMaintenanceRequestsService({ maintenanceRepository = repository } = {}) {
  return Object.freeze({
    async getAll(filters = {}) {
      return maintenanceRepository.findAll(filters);
    },

    async getById(id) {
      const request = await maintenanceRepository.findById(id);
      if (!request) throw requestError("Maintenance request not found", 404);
      return request;
    },

    async create(data) {
      const asset = await maintenanceRepository.findAssetById(data.assetId);
      if (!asset) throw requestError("Asset not found", 404);
      if (["LOST", "DISPOSED"].includes(asset.status)) throw requestError("Cannot create maintenance request for unavailable asset status");

      const requester = await maintenanceRepository.findEmployeeById(data.requesterId);
      if (!requester) throw requestError("Requester not found", 404);
      if (requester.status !== "ACTIVE") throw requestError("Requester is not active");

      return maintenanceRepository.create(data);
    },

    async updateStatus(id, data) {
      const request = await maintenanceRepository.findById(id);
      if (!request) throw requestError("Maintenance request not found", 404);
      if (["COMPLETED", "CANCELLED"].includes(request.status)) throw requestError("Completed or cancelled maintenance requests cannot be updated");

      return maintenanceRepository.updateStatus(id, {
        ...data,
        assetStatus: data.assetStatus ?? assetStatusForMaintenance(data.status),
      });
    },
  });
}

const service = createMaintenanceRequestsService();

module.exports = Object.freeze({
  ...service,
  createMaintenanceRequestsService,
});
