const departmentsService = require("./departments.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const departmentsController = {
  async listDepartments(req, res, next) {
    try {
      const departments = await departmentsService.getAllDepartments();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Departments retrieved successfully",
        data: departments,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const department = await departmentsService.getDepartmentById(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Department retrieved successfully",
        data: department,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const created = await departmentsService.createDepartment(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Department created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await departmentsService.updateDepartment(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Department updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await departmentsService.deleteDepartment(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Department deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = departmentsController;
