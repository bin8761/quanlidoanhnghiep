const locationsService = require("./locations.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const locationsController = {
  async listLocations(req, res, next) {
    try {
      const locations = await locationsService.getAllLocations();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Locations retrieved successfully",
        data: locations,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getLocation(req, res, next) {
    try {
      const { id } = req.params;
      const location = await locationsService.getLocationById(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Location retrieved successfully",
        data: location,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createLocation(req, res, next) {
    try {
      const created = await locationsService.createLocation(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Location created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await locationsService.updateLocation(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Location updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteLocation(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await locationsService.deleteLocation(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Location deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = locationsController;
