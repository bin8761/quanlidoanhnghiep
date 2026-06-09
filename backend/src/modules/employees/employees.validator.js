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
      employeeCode: z.string().trim().max(50, "Employee code must not exceed 50 characters").optional().nullable(),
      fullName: trimmedRequiredString("Full name").max(100, "Full name must not exceed 100 characters"),
      email: trimmedRequiredString("Email").email("Email must be a valid email address"),
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer").optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      avatarUrl: z.string().trim().optional().nullable(),
      position: z.string().trim().max(100).optional(),
      joinDate: z.coerce.date().optional(),
      phone: z.string().trim().max(50).optional().nullable(),
      personalEmail: z.string().trim().email("Personal email must be a valid email address").or(z.string().max(0)).optional().nullable(),
      dateOfBirth: z.coerce.date().optional().nullable(),
      gender: z.string().trim().max(20).optional().nullable(),
      permanentAddress: z.string().trim().optional().nullable(),
      currentAddress: z.string().trim().optional().nullable(),
      emergencyContact: z.any().optional().nullable(),
      education: z.any().optional().nullable(),
      skills: z.any().optional().nullable(),
      certificates: z.any().optional().nullable(),
      hometown: z.string().trim().max(100).optional().nullable(),
      ethnicity: z.string().trim().max(50).optional().nullable(),
      nationality: z.string().trim().max(50).optional().nullable(),
      identityCardNumber: z.string().trim().max(50).optional().nullable(),
      allowProfileUpdate: z.boolean().optional(),
    }),
  }),
  update: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      fullName: trimmedRequiredString("Full name").max(100, "Full name must not exceed 100 characters").optional(),
      email: trimmedRequiredString("Email").email("Email must be a valid email address").optional(),
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer").optional().nullable(),
      locationId: z.coerce.number().int().positive("Location ID must be a positive integer").optional().nullable(),
      deskX: z.coerce.number().optional().nullable(),
      deskY: z.coerce.number().optional().nullable(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      avatarUrl: z.string().trim().optional().nullable(),
      position: z.string().trim().max(100).optional(),
      joinDate: z.coerce.date().optional(),
      phone: z.string().trim().max(50).optional().nullable(),
      personalEmail: z.string().trim().email("Personal email must be a valid email address").or(z.string().max(0)).optional().nullable(),
      dateOfBirth: z.coerce.date().optional().nullable(),
      gender: z.string().trim().max(20).optional().nullable(),
      permanentAddress: z.string().trim().optional().nullable(),
      currentAddress: z.string().trim().optional().nullable(),
      emergencyContact: z.any().optional().nullable(),
      education: z.any().optional().nullable(),
      skills: z.any().optional().nullable(),
      certificates: z.any().optional().nullable(),
      hometown: z.string().trim().max(100).optional().nullable(),
      ethnicity: z.string().trim().max(50).optional().nullable(),
      nationality: z.string().trim().max(50).optional().nullable(),
      identityCardNumber: z.string().trim().max(50).optional().nullable(),
      allowProfileUpdate: z.boolean().optional(),
    }),
  }),
  delete: Object.freeze({
    params: uuidParamSchema,
  }),
});

module.exports = employeesValidators;
