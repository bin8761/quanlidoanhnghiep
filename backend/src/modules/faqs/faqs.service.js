const repository = require("./faqs.repository");
const AppError = require("../../shared/errors/AppError");

function createFaqService({ faqRepository = repository } = {}) {
  return Object.freeze({
    async createFaq(data) {
      if (!data.question || !data.answer || !data.category) {
        throw new AppError({
          statusCode: 400,
          message: "Question, answer, and category are required.",
          errorCode: "VALIDATION_ERROR",
        });
      }
      return faqRepository.create(data);
    },

    async updateFaq(id, data) {
      const existing = await faqRepository.findById(id);
      if (!existing) {
        throw new AppError({
          statusCode: 404,
          message: "FAQ not found.",
          errorCode: "VALIDATION_ERROR",
        });
      }
      return faqRepository.update(id, data);
    },

    async deleteFaq(id) {
      const existing = await faqRepository.findById(id);
      if (!existing) {
        throw new AppError({
          statusCode: 404,
          message: "FAQ not found.",
          errorCode: "VALIDATION_ERROR",
        });
      }
      return faqRepository.delete(id);
    },

    async getFaq(id) {
      const faq = await faqRepository.findById(id);
      if (!faq) {
        throw new AppError({
          statusCode: 404,
          message: "FAQ not found.",
          errorCode: "VALIDATION_ERROR",
        });
      }
      return faq;
    },

    async listFaqs(filters, userRole) {
      const search = filters.search || "";
      const category = filters.category || "";
      
      // If employee user, restrict status to SHOW
      const status = userRole === "ADMIN" ? (filters.status || "") : "SHOW";

      return faqRepository.findMany({ search, category, status });
    },

    async getCategories() {
      return faqRepository.getCategories();
    },
  });
}

const faqService = createFaqService();

module.exports = Object.freeze({
  ...faqService,
  createFaqService,
});
