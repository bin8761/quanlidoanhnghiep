const { z } = require("zod");

const uuidParamSchema = z.object({ id: z.string().trim().uuid("ID must be a valid UUID") });
const sessionStatus = z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED"]);
const result = z.enum(["OK", "MISSING", "DAMAGED"]);

module.exports = Object.freeze({
  listSessions: Object.freeze({
    query: z.object({
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer").optional(),
      status: sessionStatus.optional(),
    }),
  }),
  getSession: Object.freeze({ params: uuidParamSchema }),
  createSession: Object.freeze({
    body: z.object({
      name: z.string({ required_error: "Session name is required" }).trim().min(1).max(150),
      departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
      startDate: z.string().datetime({ message: "Start date must be a valid ISO datetime string" }).optional(),
      endDate: z.string().datetime({ message: "End date must be a valid ISO datetime string" }).optional().nullable(),
      status: sessionStatus.optional(),
      assetIds: z.array(z.string().trim().uuid("Asset ID must be a valid UUID")).optional(),
    }),
  }),
  updateItem: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      result,
      notes: z.string().trim().max(1000).optional().nullable(),
      locationId: z.coerce.number().int().positive("Location ID must be a positive integer").optional().nullable(),
      locationX: z.coerce.number().optional().nullable(),
      locationY: z.coerce.number().optional().nullable(),
      updateMaster: z.boolean().optional(),
    }),
  }),
});
