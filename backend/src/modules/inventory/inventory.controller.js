const service = require("./inventory.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async listSessions(req, res, next) {
    try {
      const sessions = await service.getSessions(req.query);
      return sendSuccess(res, { message: "Inventory sessions retrieved successfully", data: sessions });
    } catch (error) {
      return next(error);
    }
  },

  async createSession(req, res, next) {
    try {
      const session = await service.createSession(req.body);
      return sendSuccess(res, { statusCode: 201, message: "Inventory session created successfully", data: session });
    } catch (error) {
      return next(error);
    }
  },

  async getSession(req, res, next) {
    try {
      const session = await service.getSessionById(req.params.id);
      return sendSuccess(res, { message: "Inventory session retrieved successfully", data: session });
    } catch (error) {
      return next(error);
    }
  },

  async updateItem(req, res, next) {
    try {
      const item = await service.updateItem(req.params.id, req.body);
      return sendSuccess(res, { message: "Inventory item updated successfully", data: item });
    } catch (error) {
      return next(error);
    }
  },
});
