const service = require("./faqs.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const faqController = {
  async create(req, res, next) {
    try {
      const created = await service.createFaq(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "FAQ created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await service.updateFaq(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "FAQ updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await service.deleteFaq(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "FAQ deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const faq = await service.getFaq(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "FAQ retrieved successfully",
        data: faq,
      });
    } catch (error) {
      return next(error);
    }
  },

  async list(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : "USER";
      const faqs = await service.listFaqs(req.query, userRole);
      return sendSuccess(res, {
        statusCode: 200,
        message: "FAQs list retrieved successfully",
        data: faqs,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const categories = await service.getCategories();
      return sendSuccess(res, {
        statusCode: 200,
        message: "FAQ categories retrieved successfully",
        data: categories,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = faqController;
