const service = require("./tasks.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async getMyTasks(req, res, next) {
    try {
      const tasks = await service.getTasks(req.user, req.query);
      return sendSuccess(res, {
        message: "Tasks retrieved successfully",
        data: tasks,
      });
    } catch (error) {
      return next(error);
    }
  },
});
