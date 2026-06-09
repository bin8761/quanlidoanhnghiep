const { z } = require("zod");

const uuidParamSchema = z.object({ id: z.string().trim().uuid("ID must be a valid UUID") });
const optionalUuid = (label) => z.preprocess((val) => (val === "" ? null : val), z.string().trim().uuid(`${label} must be a valid UUID`).optional().nullable());
const uuid = (label) => z.string({ required_error: `${label} is required` }).trim().uuid(`${label} must be a valid UUID`);
const requestType = z.enum(["INCIDENT", "MAINTENANCE", "NEW_ALLOCATION", "EXCHANGE", "RECALL", "SOFTWARE_INSTALL", "ACCESS_GRANT", "OTHER"]);
const supportStatus = z.enum(["PENDING", "APPROVED", "IN_PROGRESS", "WAITING_USER", "COMPLETED", "REJECTED", "CANCELLED"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);
const assetStatus = z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "BROKEN", "DISPOSED"]);

module.exports = Object.freeze({
  list: Object.freeze({
    query: z.object({
      status: supportStatus.optional(),
      type: requestType.optional(),
      priority: priority.optional(),
      assetId: z.string().trim().uuid("Asset ID must be a valid UUID").optional(),
      requesterId: z.string().trim().uuid("Requester ID must be a valid UUID").optional(),
      assigneeId: z.string().trim().uuid("Assignee ID must be a valid UUID").optional(),
    }),
  }),
  getById: Object.freeze({ params: uuidParamSchema }),
  create: Object.freeze({
    body: z.object({
      type: requestType.optional().default("MAINTENANCE"),
      priority: priority.optional().default("MEDIUM"),
      assetId: optionalUuid("Asset ID"),
      requesterId: uuid("Requester ID").optional(),
      description: z.string({ required_error: "Description is required" }).trim().min(1).max(2000),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
  updateStatus: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      status: supportStatus,
      assigneeId: optionalUuid("Assignee ID"),
      resolution: z.string().trim().max(2000).optional().nullable(),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
  fulfill: Object.freeze({
    params: uuidParamSchema,
    body: z.object({
      assetId: optionalUuid("Asset ID"),
      replacementAssetId: optionalUuid("Replacement asset ID"),
      assetStatus: assetStatus.optional(),
      returnedAssetStatus: assetStatus.optional(),
      repairCost: z.coerce.number().nonnegative("Repair cost must be a positive number").optional().nullable(),
      assigneeId: optionalUuid("Assignee ID"),
      resolution: z.string({ required_error: "Resolution is required" }).trim().min(1).max(2000),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  }),
});
