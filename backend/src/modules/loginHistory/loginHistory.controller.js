const service = require("./loginHistory.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const loginHistoryController = {
  async listAllLogs(req, res, next) {
    try {
      const logs = await service.getAllLogs(req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Login histories retrieved successfully",
        data: logs,
      });
    } catch (error) {
      return next(error);
    }
  },

  async listMyLogs(req, res, next) {
    try {
      const userId = req.user.userId;
      const logs = await service.getMyLogs(userId, req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: "My login histories retrieved successfully",
        data: logs,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = loginHistoryController;
