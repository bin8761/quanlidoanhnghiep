const categoryService = require("./category.service");
const { sendSuccess } = require("../../shared/response/apiResponse");
const { CATEGORY_RESPONSE_MESSAGES } = require("./category.constants");

const categoryController = {
  async list(req, res, next) {
    try {
      const categories = await categoryService.list(req.query.search);

      return sendSuccess(res, {
        message: CATEGORY_RESPONSE_MESSAGES.LIST_SUCCESS,
        data: categories,
      });
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);

      return sendSuccess(res, {
        statusCode: 201,
        message: CATEGORY_RESPONSE_MESSAGES.CREATED_SUCCESS,
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body);

      return sendSuccess(res, {
        message: CATEGORY_RESPONSE_MESSAGES.UPDATED_SUCCESS,
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await categoryService.remove(req.params.id);

      return sendSuccess(res, {
        message: CATEGORY_RESPONSE_MESSAGES.DELETED_SUCCESS,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = categoryController;
