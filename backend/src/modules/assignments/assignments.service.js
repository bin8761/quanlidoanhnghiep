const assignmentsRepository = require("./assignments.repository");
const notificationsService = require("../notifications/notifications.service");
const logger = require("../../config/logger");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function workflowError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function createAssignmentsService({ repository = assignmentsRepository, notifications = notificationsService } = {}) {
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

      const assignment = await repository.assignAsset(data);
      try {
        await notifications.notifyAssetAssigned(assignment);
      } catch (error) {
        logger.error({ err: error, assignmentId: assignment.id }, "Failed to publish asset assignment notification");
      }

      try {
        const tasksService = require("../tasks/tasks.service");
        const recipientUserId = assignment?.employee?.user?.id;
        if (recipientUserId) {
          await tasksService.createTask({
            userId: recipientUserId,
            type: "ASSET_RECEIPT_CONFIRMATION",
            title: `Xác nhận bàn giao ${assignment.asset?.name || "thiết bị"}`,
            description: `Bạn vừa được bàn giao thiết bị ${assignment.asset?.name} (${assignment.asset?.assetCode}). Vui lòng xác nhận bàn giao.`,
            priority: "HIGH",
            actionUrl: `/employee/assets/${assignment.asset?.assetCode}`,
            referenceId: assignment.id,
          });
        }
      } catch (error) {
        logger.error({ err: error, assignmentId: assignment.id }, "Failed to create user task for asset assignment");
      }

      return assignment;
    },

    async returnAsset(data) {
      const activeAssignment = await repository.findActiveAssignmentByAssetId(data.assetId);
      if (!activeAssignment) throw workflowError("Active assignment not found for asset", 404);

      const assignment = await repository.returnAsset(activeAssignment.id, {
        returnedAt: data.returnedAt,
        notes: data.notes,
        assetStatus: data.assetStatus,
      });

      try {
        const tasksService = require("../tasks/tasks.service");
        const recipientUserId = activeAssignment?.employee?.user?.id;
        if (recipientUserId) {
          await tasksService.cancelTask(recipientUserId, "ASSET_RECEIPT_CONFIRMATION", activeAssignment.id);
        }
      } catch (error) {
        logger.error({ err: error, assignmentId: activeAssignment.id }, "Failed to cancel user task for asset return");
      }

      return assignment;
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
