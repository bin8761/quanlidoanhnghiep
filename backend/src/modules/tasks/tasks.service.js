const tasksRepository = require("./tasks.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function tasksError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function createTasksService({ repository = tasksRepository } = {}) {
  return Object.freeze({
    async getTasks(authenticatedUser, filters = {}) {
      return repository.findForUser(authenticatedUser.userId, filters);
    },

    async createTask(data) {
      if (!data.userId) throw tasksError("UserId is required to create a task");
      if (!data.type) throw tasksError("Task type is required");
      if (!data.title) throw tasksError("Task title is required");
      if (!data.actionUrl) throw tasksError("ActionUrl is required");

      return repository.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        status: data.status ?? "PENDING",
        actionUrl: data.actionUrl,
        referenceId: data.referenceId,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      });
    },

    async completeTask(userId, type, referenceId) {
      return repository.completePendingTask(userId, type, referenceId);
    },

    async cancelTask(userId, type, referenceId) {
      return repository.cancelPendingTask(userId, type, referenceId);
    }
  });
}

const service = createTasksService();

module.exports = Object.freeze({
  ...service,
  createTasksService,
});
