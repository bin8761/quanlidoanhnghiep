const employeesRepository = require("./employees.repository");
const departmentsRepository = require("../departments/departments.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createEmployeesService({ repository = employeesRepository, deptRepository = departmentsRepository } = {}) {
  return Object.freeze({
    async getAllEmployees(filters = {}) {
      return repository.findAll(filters);
    },

    async getEmployeeById(id, authenticatedUser) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND, // Matches user/employee not found error pattern
        });
      }

      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(id, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }
      }

      return employee;
    },

    async createEmployee(data) {
      const existingCode = await repository.findByEmployeeCode(data.employeeCode);
      if (existingCode) {
        throw new AppError({
          message: "Employee code already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const existingEmail = await repository.findByEmail(data.email);
      if (existingEmail) {
        throw new AppError({
          message: "Employee email already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      if (data.departmentId) {
        const dept = await deptRepository.findById(data.departmentId);
        if (!dept) {
          throw new AppError({
            message: "Department not found",
            statusCode: 404,
            errorCode: "DEPARTMENT_NOT_FOUND",
          });
        }
      }

      return repository.create(data);
    },

    async updateEmployee(id, data) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      if (data.email && data.email !== employee.email) {
        const existingEmail = await repository.findByEmail(data.email);
        if (existingEmail) {
          throw new AppError({
            message: "Employee email already exists",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      if (data.departmentId) {
        const dept = await deptRepository.findById(data.departmentId);
        if (!dept) {
          throw new AppError({
            message: "Department not found",
            statusCode: 404,
            errorCode: "DEPARTMENT_NOT_FOUND",
          });
        }
      }

      return repository.update(id, data);
    },

    async deleteEmployee(id) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      const hasUser = await repository.hasUserAccount(id);
      if (hasUser) {
        throw new AppError({
          message: "Cannot delete employee linked to a user account",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const assignmentCount = await repository.countAssignments(id);
      if (assignmentCount > 0) {
        throw new AppError({
          message: "Cannot delete employee with active asset assignments",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },
  });
}

const employeesService = createEmployeesService();

module.exports = Object.freeze({
  ...employeesService,
  createEmployeesService,
});
