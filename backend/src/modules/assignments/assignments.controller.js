const assignmentsService = require("./assignments.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

module.exports = Object.freeze({
  async myAssignments(req, res, next) {
    try {
      const assignments = await assignmentsService.getMyAssignments(req.user);
      return sendSuccess(res, { statusCode: 200, message: "My assignments retrieved successfully", data: assignments });
    } catch (error) {
      return next(error);
    }
  },

  async myHistory(req, res, next) {
    try {
      const history = await assignmentsService.getMyHistory(req.user);
      return sendSuccess(res, { statusCode: 200, message: "My assignment history retrieved successfully", data: history });
    } catch (error) {
      return next(error);
    }
  },

  async assign(req, res, next) {
    try {
      const assignment = await assignmentsService.assignAsset(req.body);
      return sendSuccess(res, { statusCode: 201, message: "Asset assigned successfully", data: assignment });
    } catch (error) {
      return next(error);
    }
  },

  async returnAsset(req, res, next) {
    try {
      const assignment = await assignmentsService.returnAsset(req.body);
      return sendSuccess(res, { statusCode: 200, message: "Asset returned successfully", data: assignment });
    } catch (error) {
      return next(error);
    }
  },

  async transfer(req, res, next) {
    try {
      const assignment = await assignmentsService.transferAsset(req.body);
      return sendSuccess(res, { statusCode: 201, message: "Asset transferred successfully", data: assignment });
    } catch (error) {
      return next(error);
    }
  },

  async history(req, res, next) {
    try {
      const history = await assignmentsService.getHistory(req.query);
      return sendSuccess(res, { statusCode: 200, message: "Assignment history retrieved successfully", data: history });
    } catch (error) {
      return next(error);
    }
  },
});
