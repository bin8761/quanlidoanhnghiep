const assignmentsRepository = require("./assignments.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function workflowError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function createAssignmentsService({ repository = assignmentsRepository } = {}) {
  return Object.freeze({
    async getMyAssignments(authenticatedUser) {
      if (!authenticatedUser) throw new Error("Unauthorized");
      const employee = await repository.findEmployeeByUserId(authenticatedUser.userId);
      if (!employee) throw new Error("Employee not found");
      return repository.findMyAssignments(employee.id);
    },

    async getMyHistory(authenticatedUser) {
      if (!authenticatedUser) throw new Error("Unauthorized");
      const employee = await repository.findEmployeeByUserId(authenticatedUser.userId);
      if (!employee) throw new Error("Employee not found");
      return repository.findHistory({ employeeId: employee.id });
    },

    async getHistory(filters = {}) {
      return repository.findHistory(filters);
    },

    async assignAsset(data) {
      const asset = await repository.findAssetById(data.assetId);
      if (!asset) throw workflowError("Asset not found", 404);
      if (asset.status !== "AVAILABLE") throw workflowError("Only AVAILABLE assets can be assigned");

      const employee = await repository.findEmployeeById(data.employeeId);
      if (!employee) throw workflowError("Employee not found", 404);
      if (employee.status !== "ACTIVE") throw workflowError("Employee is not active");

      const activeAssignment = await repository.findActiveAssignmentByAssetId(data.assetId);
      if (activeAssignment) throw workflowError("Asset already has an active assignment");

      return repository.assignAsset(data);
    },

    async returnAsset(data) {
      const activeAssignment = await repository.findActiveAssignmentByAssetId(data.assetId);
      if (!activeAssignment) throw workflowError("Active assignment not found for asset", 404);

      return repository.returnAsset(activeAssignment.id, {
        returnedAt: data.returnedAt,
        notes: data.notes,
        assetStatus: data.assetStatus,
      });
    },

    async transferAsset(data) {
      const activeAssignment = await repository.findActiveAssignmentByAssetId(data.assetId);
      if (!activeAssignment) throw workflowError("Active assignment not found for asset", 404);
      if (activeAssignment.employeeId === data.toEmployeeId) throw workflowError("Target employee must be different from current employee");

      const employee = await repository.findEmployeeById(data.toEmployeeId);
      if (!employee) throw workflowError("Target employee not found", 404);
      if (employee.status !== "ACTIVE") throw workflowError("Target employee is not active");

      return repository.transferAsset(activeAssignment.id, data);
    },
  });
}

const assignmentsService = createAssignmentsService();

module.exports = Object.freeze({
  ...assignmentsService,
  createAssignmentsService,
});
