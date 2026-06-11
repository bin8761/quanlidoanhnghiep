const departmentsService = require("./departments.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const departmentsController = {
  async listDepartments(req, res, next) {
    try {
      const departments = await departmentsService.getAllDepartments();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Danh sách phòng ban đã được tải",
        data: departments,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { detail } = req.query;
      const department = detail === "true"
        ? await departmentsService.getDepartmentDetail(id)
        : await departmentsService.getDepartmentById(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Thông tin phòng ban đã được tải",
        data: department,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getDashboardSummary(req, res, next) {
    try {
      const summary = await departmentsService.getDashboardSummary();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Dữ liệu tổng quan phòng ban đã được tải",
        data: summary,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const actorId = req.user?.userId || null;
      const created = await departmentsService.createDepartment(req.body, actorId);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Tạo phòng ban thành công",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.user?.userId || null;
      const updated = await departmentsService.updateDepartment(id, req.body, actorId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Cập nhật phòng ban thành công",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.user?.userId || null;
      const deleted = await departmentsService.deleteDepartment(id, actorId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Xóa phòng ban thành công",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateQuotas(req, res, next) {
    try {
      const { id } = req.params;
      const { quotas } = req.body;
      const actorId = req.user?.userId || null;
      const updatedQuotas = await departmentsService.updateDepartmentQuotas(id, quotas, actorId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Cập nhật hạn mức tài sản thành công",
        data: updatedQuotas,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = departmentsController;
