const categoriesRepository = require("./categories.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createCategoriesService({ repository = categoriesRepository } = {}) {
  return Object.freeze({
    async getAllCategories() {
      return repository.findAll();
    },

    async getCategoryById(id) {
      const category = await repository.findById(id);
      if (!category) {
        throw new AppError({
          message: "Category not found",
          statusCode: 404,
          errorCode: "CATEGORY_NOT_FOUND",
        });
      }
      return category;
    },

    async createCategory(data) {
      const existing = await repository.findByName(data.name);
      if (existing) {
        throw new AppError({
          message: "Category name already exists",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.create(data);
    },

    async updateCategory(id, data) {
      const category = await repository.findById(id);
      if (!category) {
        throw new AppError({
          message: "Category not found",
          statusCode: 404,
          errorCode: "CATEGORY_NOT_FOUND",
        });
      }

      if (data.name && data.name !== category.name) {
        const existing = await repository.findByName(data.name);
        if (existing) {
          throw new AppError({
            message: "Category name already exists",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.update(id, data);
    },

    async deleteCategory(id) {
      const category = await repository.findById(id);
      if (!category) {
        throw new AppError({
          message: "Category not found",
          statusCode: 404,
          errorCode: "CATEGORY_NOT_FOUND",
        });
      }

      const assetCount = await repository.countAssets(id);
      if (assetCount > 0) {
        throw new AppError({
          message: "Cannot delete category with associated assets",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },
  });
}

const categoriesService = createCategoriesService();

module.exports = Object.freeze({
  ...categoriesService,
  createCategoriesService,
});
