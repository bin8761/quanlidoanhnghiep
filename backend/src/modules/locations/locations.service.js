const locationsRepository = require("./locations.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createLocationsService({ repository = locationsRepository } = {}) {
  return Object.freeze({
    async getAllLocations() {
      return repository.findAll();
    },

    async getLocationById(id) {
      const location = await repository.findById(id);
      if (!location) {
        throw new AppError({
          message: "Location not found",
          statusCode: 404,
          errorCode: "LOCATION_NOT_FOUND",
        });
      }
      return location;
    },

    async createLocation(data) {
      const existing = await repository.findByName(data.name);
      if (existing) {
        throw new AppError({
          message: "Location name already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.create(data);
    },

    async updateLocation(id, data) {
      const location = await repository.findById(id);
      if (!location) {
        throw new AppError({
          message: "Location not found",
          statusCode: 404,
          errorCode: "LOCATION_NOT_FOUND",
        });
      }

      if (data.name && data.name !== location.name) {
        const existing = await repository.findByName(data.name);
        if (existing) {
          throw new AppError({
            message: "Location name already exists",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.update(id, data);
    },

    async deleteLocation(id) {
      const location = await repository.findById(id);
      if (!location) {
        throw new AppError({
          message: "Location not found",
          statusCode: 404,
          errorCode: "LOCATION_NOT_FOUND",
        });
      }

      const employeeCount = await repository.countEmployees(id);
      if (employeeCount > 0) {
        throw new AppError({
          message: "Cannot delete location with active employees assigned to it",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const assetCount = await repository.countAssets(id);
      if (assetCount > 0) {
        throw new AppError({
          message: "Cannot delete location with active assets assigned to it",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },
  });
}

const locationsService = createLocationsService();

module.exports = Object.freeze({
  ...locationsService,
  createLocationsService,
});
