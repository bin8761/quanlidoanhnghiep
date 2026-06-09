const { z } = require("zod");

const trimmedRequiredString = (fieldLabel) =>
  z.string({ required_error: `${fieldLabel} is required` })
    .trim()
    .min(1, `${fieldLabel} is required`);

const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: "ID must be a number" })
    .int("ID must be an integer")
    .positive("ID must be a positive integer"),
});

const locationsValidators = Object.freeze({
  getById: Object.freeze({
    params: idParamSchema,
  }),
  create: Object.freeze({
    body: z.object({
      name: trimmedRequiredString("Location name").max(100, "Location name must not exceed 100 characters"),
      description: z.string().trim().max(500, "Description must not exceed 500 characters").optional().nullable(),
      floorPlanUrl: trimmedRequiredString("Floor plan image URL"),
    }),
  }),
  update: Object.freeze({
    params: idParamSchema,
    body: z.object({
      name: trimmedRequiredString("Location name").max(100, "Location name must not exceed 100 characters").optional(),
      description: z.string().trim().max(500, "Description must not exceed 500 characters").optional().nullable(),
      floorPlanUrl: z.string().trim().optional(),
    }),
  }),
  delete: Object.freeze({
    params: idParamSchema,
  }),
});

module.exports = locationsValidators;
