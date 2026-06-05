const service = require("./maintenanceRequests.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async list(req, res, next) {
    try {
      const requests = await service.getAll(req.query);
      return sendSuccess(res, { message: "Maintenance requests retrieved successfully", data: requests });
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const request = await service.create(req.body);
      return sendSuccess(res, { statusCode: 201, message: "Maintenance request created successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const request = await service.getById(req.params.id);
      return sendSuccess(res, { message: "Maintenance request retrieved successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const request = await service.updateStatus(req.params.id, req.body);
      return sendSuccess(res, { message: "Maintenance request status updated successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },
});
