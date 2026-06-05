const service = require("./reports.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async summary(_req, res, next) {
    try {
      const data = await service.getSummary();
      return sendSuccess(res, { message: "Report summary retrieved successfully", data });
    } catch (error) {
      return next(error);
    }
  },

  async assetsByCategory(_req, res, next) {
    try {
      const data = await service.getAssetsByCategory();
      return sendSuccess(res, { message: "Assets by category report retrieved successfully", data });
    } catch (error) {
      return next(error);
    }
  },

  async assetsByDepartment(_req, res, next) {
    try {
      const data = await service.getAssetsByDepartment();
      return sendSuccess(res, { message: "Assets by department report retrieved successfully", data });
    } catch (error) {
      return next(error);
    }
  },
});
