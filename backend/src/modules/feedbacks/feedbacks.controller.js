const service = require("./feedbacks.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const feedbacksController = {
  async create(req, res, next) {
    try {
      const userId = req.user.userId;
      const created = await service.createFeedback(userId, req.body, req.file);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Feedback submitted successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await service.updateFeedbackStatus(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Feedback status updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const fb = await service.getFeedbackDetails(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Feedback retrieved successfully",
        data: fb,
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req, res, next) {
    try {
      const fbs = await service.listFeedbacks(req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Feedback list retrieved successfully",
        data: fbs,
      });
    } catch (error) {
      return next(error);
    }
  },

  async listMy(req, res, next) {
    try {
      const userId = req.user.userId;
      const fbs = await service.listMyFeedbacks(userId, req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: "My feedback list retrieved successfully",
        data: fbs,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = feedbacksController;
