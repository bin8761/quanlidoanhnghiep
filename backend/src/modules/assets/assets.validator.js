const { z } = require("zod");

const trimmedRequiredString = (fieldLabel) =>
  z.string({ required_error: `${fieldLabel} is required` })
    .trim()
    .min(1, `${fieldLabel} is required`);

const uuidParamSchema = z.object({
  id: z.string().trim().uuid("ID must be a valid UUID"),
});

const assetStatusSchema = z.enum([
  "AVAILABLE",
  "ASSIGNED",
  "MAINTENANCE",
  "BROKEN",
  "LOST",
  "DISPOSED",
]);

const assetsValidators = Object.freeze({
  getById: Object.freeze({
    params: uuidParamSchema,
  }),
  create: Object.freeze({
    body: z.object({
      assetCode: trimmedRequiredString("Asset code").max(50, "Asset code must not exceed 50 characters"),
      name: trimmedRequiredString("Asset name").max(100, "Asset name must not exceed 100 characters"),
      categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
      serialNumber: z.string().trim().max(100).optional().nullable(),
      purchaseDate: z.string().datetime({ message: "Purchase date must be a valid ISO datetime string" }).optional().nullable(),
      value: z.coerce.number().nonnegative("Value must be a positive number").optional().nullable(),
      status: assetStatusSchema.optional(),
      imageUrl: z.string().trim().url("Image URL must be a valid URL").optional().nullable(),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
  update: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      assetCode: trimmedRequiredString("Asset code").max(50, "Asset code must not exceed 50 characters").optional(),
      name: trimmedRequiredString("Asset name").max(100, "Asset name must not exceed 100 characters").optional(),
      categoryId: z.coerce.number().int().positive("Category ID must be a positive integer").optional(),
      serialNumber: z.string().trim().max(100).optional().nullable(),
      purchaseDate: z.string().datetime({ message: "Purchase date must be a valid ISO datetime string" }).optional().nullable(),
      value: z.coerce.number().nonnegative("Value must be a positive number").optional().nullable(),
      status: assetStatusSchema.optional(),
      imageUrl: z.string().trim().url("Image URL must be a valid URL").optional().nullable(),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
  delete: Object.freeze({
    params: uuidParamSchema,
  }),
});

module.exports = assetsValidators;
