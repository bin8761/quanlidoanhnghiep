const categoryRepository = require("./category.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { CATEGORY_ERROR_MESSAGES } = require("./category.constants");

function createCategoryNotFoundError() {
  return new AppError({
    message: CATEGORY_ERROR_MESSAGES.NOT_FOUND,
    statusCode: 404,
    errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
  });
}

function createCategoryAlreadyExistsError() {
  return new AppError({
    message: CATEGORY_ERROR_MESSAGES.ALREADY_EXISTS,
    statusCode: 409,
    errorCode: ERROR_CODES.CATEGORY_ALREADY_EXISTS,
  });
}

function normalizePayload(payload) {
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
  };
}

function isPrismaError(error, code) {
  return Boolean(error && typeof error === "object" && error.code === code);
}

function createCategoryService({ repository = categoryRepository } = {}) {
  return Object.freeze({
    async list(search = "") {
      return repository.findAll(search.trim());
    },

    async create(payload) {
      const normalizedPayload = normalizePayload(payload);
      const duplicate = await repository.findByName(normalizedPayload.name);

      if (duplicate) {
        throw createCategoryAlreadyExistsError();
      }

      try {
        return await repository.create({
          ...normalizedPayload,
          status: "ACTIVE",
        });
      } catch (error) {
        if (isPrismaError(error, "P2002")) {
          throw createCategoryAlreadyExistsError();
        }

        throw error;
      }
    },

    async update(categoryId, payload) {
      const currentCategory = await repository.findById(categoryId);

      if (!currentCategory) {
        throw createCategoryNotFoundError();
      }

      const normalizedPayload = normalizePayload(payload);
      const duplicate = await repository.findByName(normalizedPayload.name);

      if (duplicate && duplicate.id !== categoryId) {
        throw createCategoryAlreadyExistsError();
      }

      try {
        return await repository.update(categoryId, normalizedPayload);
      } catch (error) {
        if (isPrismaError(error, "P2002")) {
          throw createCategoryAlreadyExistsError();
        }

        if (isPrismaError(error, "P2025")) {
          throw createCategoryNotFoundError();
        }

        throw error;
      }
    },

    async remove(categoryId) {
      const currentCategory = await repository.findById(categoryId);

      if (!currentCategory) {
        throw createCategoryNotFoundError();
      }

      try {
        await repository.remove(categoryId);
      } catch (error) {
        if (isPrismaError(error, "P2025")) {
          throw createCategoryNotFoundError();
        }

        throw error;
      }
    },
  });
}

const categoryService = createCategoryService();

module.exports = Object.freeze({
  ...categoryService,
  createCategoryService,
  createCategoryNotFoundError,
  createCategoryAlreadyExistsError,
  normalizePayload,
  isPrismaError,
});
