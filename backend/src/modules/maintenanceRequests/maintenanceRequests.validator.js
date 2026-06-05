const { z } = require("zod");

const uuidParamSchema = z.object({ id: z.string().trim().uuid("ID must be a valid UUID") });
const uuid = (label) => z.string({ required_error: `${label} is required` }).trim().uuid(`${label} must be a valid UUID`);
const maintenanceStatus = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

module.exports = Object.freeze({
  list: Object.freeze({
    query: z.object({
      status: maintenanceStatus.optional(),
      assetId: z.string().trim().uuid("Asset ID must be a valid UUID").optional(),
      requesterId: z.string().trim().uuid("Requester ID must be a valid UUID").optional(),
    }),
  }),
  getById: Object.freeze({ params: uuidParamSchema }),
  create: Object.freeze({
    body: z.object({
      assetId: uuid("Asset ID"),
      requesterId: uuid("Requester ID"),
      description: z.string({ required_error: "Description is required" }).trim().min(1).max(2000),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
  updateStatus: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      status: maintenanceStatus,
      repairCost: z.coerce.number().nonnegative("Repair cost must be a positive number").optional().nullable(),
      assetStatus: z.enum(["AVAILABLE", "MAINTENANCE", "BROKEN", "DISPOSED"]).optional(),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
});
