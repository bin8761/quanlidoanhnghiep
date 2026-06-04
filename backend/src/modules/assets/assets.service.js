const assetsRepository = require("./assets.repository");
const categoriesRepository = require("../categories/categories.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createAssetsService({ repository = assetsRepository, catRepository = categoriesRepository } = {}) {
  return Object.freeze({
    async getAllAssets(filters = {}) {
      return repository.findAll(filters);
    },

    async getAssetById(id) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }
      return asset;
    },

    async createAsset(data) {
      const existing = await repository.findByAssetCode(data.assetCode);
      if (existing) {
        throw new AppError({
          message: "Asset code already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const cat = await catRepository.findById(data.categoryId);
      if (!cat) {
        throw new AppError({
          message: "Category not found",
          statusCode: 404,
          errorCode: "CATEGORY_NOT_FOUND",
        });
      }

      return repository.create(data);
    },

    async updateAsset(id, data) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }

      if (data.categoryId) {
        const cat = await catRepository.findById(data.categoryId);
        if (!cat) {
          throw new AppError({
            message: "Category not found",
            statusCode: 404,
            errorCode: "CATEGORY_NOT_FOUND",
          });
        }
      }

      if (data.status && data.status !== asset.status) {
        const activeAssignmentCount = await repository.countActiveAssignments(id);
        if (activeAssignmentCount > 0 && data.status !== "ASSIGNED") {
          throw new AppError({
            message: "Cannot change status from ASSIGNED while asset is actively assigned to an employee. Use assignment return API.",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.update(id, data);
    },

    async deleteAsset(id) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }

      const activeAssignmentCount = await repository.countActiveAssignments(id);
      if (activeAssignmentCount > 0) {
        throw new AppError({
          message: "Cannot delete asset with active assignment",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },
  });
}

const assetsService = createAssetsService();

module.exports = Object.freeze({
  ...assetsService,
  createAssetsService,
});
