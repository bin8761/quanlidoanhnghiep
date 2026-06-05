const employeesService = require("./employees.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const employeesController = {
  async listEmployees(req, res, next) {
    try {
      const { keyword, status, departmentId } = req.query;
      const employees = await employeesService.getAllEmployees({
        keyword,
        status,
        departmentId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: "Employees retrieved successfully",
        data: employees,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeesService.getEmployeeById(id, req.user);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Employee retrieved successfully",
        data: employee,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createEmployee(req, res, next) {
    try {
      const created = await employeesService.createEmployee(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Employee created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await employeesService.updateEmployee(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Employee updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await employeesService.deleteEmployee(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Employee deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = employeesController;
