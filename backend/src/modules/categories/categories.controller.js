const categoriesService = require("./categories.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const categoriesController = {
  async listCategories(req, res, next) {
    try {
      const categories = await categoriesService.getAllCategories();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Categories retrieved successfully",
        data: categories,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoriesService.getCategoryById(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Category retrieved successfully",
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const created = await categoriesService.createCategory(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Category created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await categoriesService.updateCategory(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Category updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await categoriesService.deleteCategory(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = categoriesController;
