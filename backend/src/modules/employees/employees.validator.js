const { z } = require("zod");

const trimmedRequiredString = (fieldLabel) =>
  z.string({ required_error: `${fieldLabel} is required` })
    .trim()
    .min(1, `${fieldLabel} is required`);

const uuidParamSchema = z.object({
  id: z.string().trim().uuid("ID must be a valid UUID"),
});

const employeesValidators = Object.freeze({
  getById: Object.freeze({
    params: uuidParamSchema,
  }),
  create: Object.freeze({
    body: z.object({
      employeeCode: trimmedRequiredString("Employee code").max(50, "Employee code must not exceed 50 characters"),
      fullName: trimmedRequiredString("Full name").max(100, "Full name must not exceed 100 characters"),
      email: trimmedRequiredString("Email").email("Email must be a valid email address"),
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer").optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    }),
  }),
  update: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      fullName: trimmedRequiredString("Full name").max(100, "Full name must not exceed 100 characters").optional(),
      email: trimmedRequiredString("Email").email("Email must be a valid email address").optional(),
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer").optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    }),
  }),
  delete: Object.freeze({
    params: uuidParamSchema,
  }),
});

module.exports = employeesValidators;
