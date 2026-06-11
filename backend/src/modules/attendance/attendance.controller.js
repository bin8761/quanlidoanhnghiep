const service = require("./attendance.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const attendanceController = {
  async checkIn(req, res, next) {
    try {
      const userId = req.user.userId;
      const record = await service.checkIn(userId);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Check-in successful",
        data: record,
      });
    } catch (error) {
      return next(error);
    }
  },

  async checkOut(req, res, next) {
    try {
      const userId = req.user.userId;
      const record = await service.checkOut(userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Check-out successful",
        data: record,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const status = await service.getStatus(userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Attendance status retrieved successfully",
        data: status,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getMyHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const history = await service.getMyHistory(userId);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Attendance history retrieved successfully",
        data: history,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getAllHistory(req, res, next) {
    try {
      const history = await service.getAllHistory(req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: "All attendance histories retrieved successfully",
        data: history,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = attendanceController;
