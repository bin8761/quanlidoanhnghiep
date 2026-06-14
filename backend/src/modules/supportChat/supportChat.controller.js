const service = require("./supportChat.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const supportChatController = Object.freeze({
  async sendMessage(req, res, next) {
    try {
      const messages = await service.handleEmployeeMessage(req.user.userId, req.body.message);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Message sent successfully",
        data: messages,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await service.getEmployeeMessages(req.user.userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Chat history retrieved successfully",
        data: messages,
      });
    } catch (error) {
      return next(error);
    }
  },

  async listSessionsForAdmin(req, res, next) {
    try {
      const sessions = await service.listActiveSessionsForAdmin(req.user);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Active chat sessions retrieved successfully",
        data: sessions,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getSessionDetailsForAdmin(req, res, next) {
    try {
      const details = await service.getSessionMessagesForAdmin(req.user, req.params.sessionId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Session details retrieved successfully",
        data: details,
      });
    } catch (error) {
      return next(error);
    }
  },

  async sendAdminMessage(req, res, next) {
    try {
      const messages = await service.sendAdminMessage(req.user, req.params.sessionId, req.body.message);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Reply sent successfully",
        data: messages,
      });
    } catch (error) {
      return next(error);
    }
  },

  async closeSession(req, res, next) {
    try {
      const result = await service.closeSession(req.user, req.params.sessionId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Session closed successfully",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },
});

module.exports = supportChatController;
