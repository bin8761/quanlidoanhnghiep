const { z } = require("zod");

const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function validateRequest(schemas = {}) {
  const normalizedSchemas = {
    body: schemas.body,
    params: schemas.params,
    query: schemas.query,
  };

  return function requestValidator(req, _res, next) {
    try {
      if (normalizedSchemas.body instanceof z.ZodType) {
        req.body = normalizedSchemas.body.parse(req.body);
      }

      if (normalizedSchemas.params instanceof z.ZodType) {
        req.params = normalizedSchemas.params.parse(req.params);
      }

      if (normalizedSchemas.query instanceof z.ZodType) {
        req.query = normalizedSchemas.query.parse(req.query);
      }

      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError({
            message: "Validation failed",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
            details: formatZodIssues(error.issues),
          }),
        );
      }

      return next(error);
    }
  };
}

module.exports = validateRequest;
