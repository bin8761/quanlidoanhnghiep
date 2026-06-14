const service = require("./supportRequests.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async list(req, res, next) {
    try {
      const requests = await service.getAll(req.query, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support requests retrieved successfully", data: requests });
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const request = await service.create(req.body, { authenticatedUser: req.user });
      return sendSuccess(res, { statusCode: 201, message: "Support request created successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const request = await service.getById(req.params.id, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support request retrieved successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const request = await service.updateStatus(req.params.id, req.body, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support request status updated successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async fulfill(req, res, next) {
    try {
      const request = await service.fulfill(req.params.id, req.body, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support request fulfilled successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const request = await service.cancel(req.params.id, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support request cancelled successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },

  async rate(req, res, next) {
    try {
      const request = await service.rate(req.params.id, req.body, { authenticatedUser: req.user });
      return sendSuccess(res, { message: "Support request rated successfully", data: request });
    } catch (error) {
      return next(error);
    }
  },
});
