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

const departmentsValidators = Object.freeze({
  getById: Object.freeze({
    params: idParamSchema,
  }),
  create: Object.freeze({
    body: z.object({
      code: trimmedRequiredString("Mã phòng ban")
        .max(50, "Mã phòng ban không vượt quá 50 ký tự")
        .regex(/^[A-Za-z0-9_-]+$/, "Mã phòng ban chỉ chứa chữ, số, gạch ngang và gạch dưới"),
      name: trimmedRequiredString("Tên phòng ban").max(100, "Tên phòng ban không được vượt quá 100 ký tự"),
      description: z.string().trim().max(500, "Mô tả không được vượt quá 500 ký tự").optional().nullable(),
      managerId: z.string().uuid("ID Trưởng phòng không hợp lệ").or(z.literal("")).optional().nullable(),
      email: z.string().email("Email không đúng định dạng").or(z.literal("")).optional().nullable(),
      phone: z.string().max(50, "Số điện thoại không được vượt quá 50 ký tự").optional().nullable(),
      establishedDate: z.preprocess(val => val ? new Date(val) : null, z.date().optional().nullable()),
      branch: z.string().max(100, "Tên chi nhánh không được vượt quá 100 ký tự").optional().nullable(),
      status: z.enum(["ACTIVE", "SUSPENDED", "DISSOLVED"]).default("ACTIVE"),
      parentId: z.preprocess(val => val === "" || val === null || val === undefined ? null : Number(val), z.number().int().positive("ID phòng ban cha không hợp lệ").optional().nullable()),
      annualBudget: z.preprocess(val => val === "" || val === null || val === undefined ? 0 : Number(val), z.number().nonnegative("Ngân sách năm phải lớn hơn hoặc bằng 0").optional().nullable()),
    }),
  }),
  update: Object.freeze({
    params: idParamSchema,
    body: z.object({
      code: z.string().trim().min(1, "Mã phòng ban không được trống").max(50, "Mã phòng ban không vượt quá 50 ký tự").regex(/^[A-Za-z0-9_-]+$/, "Mã phòng ban chỉ chứa chữ, số, gạch ngang và gạch dưới").optional(),
      name: z.string().trim().min(1, "Tên phòng ban không được trống").max(100, "Tên phòng ban không được vượt quá 100 ký tự").optional(),
      description: z.string().trim().max(500, "Mô tả không được vượt quá 500 ký tự").optional().nullable(),
      managerId: z.string().uuid("ID Trưởng phòng không hợp lệ").or(z.literal("")).optional().nullable(),
      email: z.string().email("Email không đúng định dạng").or(z.literal("")).optional().nullable(),
      phone: z.string().max(50, "Số điện thoại không được vượt quá 50 ký tự").optional().nullable(),
      establishedDate: z.preprocess(val => val ? new Date(val) : null, z.date().optional().nullable()),
      branch: z.string().max(100, "Tên chi nhánh không được vượt quá 100 ký tự").optional().nullable(),
      status: z.enum(["ACTIVE", "SUSPENDED", "DISSOLVED"]).optional(),
      parentId: z.preprocess(val => val === "" || val === null || val === undefined ? null : Number(val), z.number().int().positive("ID phòng ban cha không hợp lệ").optional().nullable()),
      annualBudget: z.preprocess(val => val === "" || val === null || val === undefined ? 0 : Number(val), z.number().nonnegative("Ngân sách năm phải lớn hơn hoặc bằng 0").optional().nullable()),
    }),
  }),
  delete: Object.freeze({
    params: idParamSchema,
  }),
  updateQuotas: Object.freeze({
    params: idParamSchema,
    body: z.object({
      quotas: z.array(z.object({
        categoryId: z.coerce.number().int().positive("Category ID must be positive"),
        maxQuantity: z.coerce.number().int().nonnegative("Hạn mức tối đa phải lớn hơn hoặc bằng 0"),
      })),
    }),
  }),
});

module.exports = departmentsValidators;
