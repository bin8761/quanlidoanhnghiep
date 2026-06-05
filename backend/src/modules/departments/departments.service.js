const departmentsRepository = require("./departments.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createDepartmentsService({ repository = departmentsRepository } = {}) {
  return Object.freeze({
    async getAllDepartments() {
      return repository.findAll();
    },

    async getDepartmentById(id) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Department not found",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }
      return department;
    },

    async createDepartment(data) {
      const existing = await repository.findByName(data.name);
      if (existing) {
        throw new AppError({
          message: "Department name already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.create(data);
    },

    async updateDepartment(id, data) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Department not found",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      if (data.name && data.name !== department.name) {
        const existing = await repository.findByName(data.name);
        if (existing) {
          throw new AppError({
            message: "Department name already exists",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.update(id, data);
    },

    async deleteDepartment(id) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Department not found",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      const employeeCount = await repository.countEmployees(id);
      if (employeeCount > 0) {
        throw new AppError({
          message: "Cannot delete department with active employees",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },
  });
}

const departmentsService = createDepartmentsService();

module.exports = Object.freeze({
  ...departmentsService,
  createDepartmentsService,
});
