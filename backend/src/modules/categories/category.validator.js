const { z } = require("zod");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Category name must contain at least 2 characters")
  .max(100, "Category name must not exceed 100 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must not exceed 500 characters")
  .optional()
  .transform((value) => value || null);

const uuidParamsSchema = z.object({
  id: z.string().trim().uuid("Category ID must be a valid UUID"),
});

const categoryPayloadSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

module.exports = Object.freeze({
  list: Object.freeze({
    query: z.object({
      search: z.string().trim().max(100).optional().default(""),
    }),
  }),
  create: Object.freeze({
    body: categoryPayloadSchema,
  }),
  update: Object.freeze({
    params: uuidParamsSchema,
    body: categoryPayloadSchema,
  }),
  remove: Object.freeze({
    params: uuidParamsSchema,
  }),
});
