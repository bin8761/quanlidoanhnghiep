const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const repository = require("./feedbacks.repository");
const AppError = require("../../shared/errors/AppError");

function createFeedbackService({ feedbackRepository = repository } = {}) {
  return Object.freeze({
    async createFeedback(userId, data, file) {
      if (!data.title || !data.content || !data.category) {
        throw new AppError({
          statusCode: 400,
          message: "Title, content, and category are required.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      let fileUrl = null;
      if (file) {
        const uploadDir = path.join(__dirname, "../../../uploads/feedbacks");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const extension = path.extname(file.originalname) || ".bin";
        const fileName = `${crypto.randomUUID()}${extension}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, file.buffer);
        fileUrl = `/uploads/feedbacks/${fileName}`;
      }

      return feedbackRepository.create({
        userId,
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        fileUrl,
      });
    },

    async updateFeedbackStatus(id, { status, adminNote }) {
      const existing = await feedbackRepository.findById(id);
      if (!existing) {
        throw new AppError({
          statusCode: 404,
          message: "Feedback not found.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        throw new AppError({
          statusCode: 400,
          message: "Invalid status value.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      return feedbackRepository.update(id, { status, adminNote });
    },

    async listFeedbacks(filters) {
      return feedbackRepository.findMany(filters);
    },

    async listMyFeedbacks(userId, filters) {
      return feedbackRepository.findByUserId(userId, filters);
    },

    async getFeedbackDetails(id) {
      const fb = await feedbackRepository.findById(id);
      if (!fb) {
        throw new AppError({
          statusCode: 404,
          message: "Feedback not found.",
          errorCode: "VALIDATION_ERROR",
        });
      }
      return fb;
    },
  });
}

const feedbackService = createFeedbackService();

module.exports = Object.freeze({
  ...feedbackService,
  createFeedbackService,
});
