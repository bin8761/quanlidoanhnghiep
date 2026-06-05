const { z } = require("zod");

const uuid = (label) => z.string({ required_error: `${label} is required` }).trim().uuid(`${label} must be a valid UUID`);
const optionalDate = z.string().datetime({ message: "Date must be a valid ISO datetime string" }).optional();
const notes = z.string().trim().max(1000).optional().nullable();

module.exports = Object.freeze({
  assign: Object.freeze({
    body: z.object({
      assetId: uuid("Asset ID"),
      employeeId: uuid("Employee ID"),
      assignedAt: optionalDate,
      notes,
    }),
  }),
  return: Object.freeze({
    body: z.object({
      assetId: uuid("Asset ID"),
      returnedAt: optionalDate,
      assetStatus: z.enum(["AVAILABLE", "MAINTENANCE", "BROKEN", "LOST"]).optional(),
      notes,
    }),
  }),
  transfer: Object.freeze({
    body: z.object({
      assetId: uuid("Asset ID"),
      toEmployeeId: uuid("Target employee ID"),
      transferredAt: optionalDate,
      notes,
    }),
  }),
  history: Object.freeze({
    query: z.object({
      assetId: z.string().trim().uuid("Asset ID must be a valid UUID").optional(),
      employeeId: z.string().trim().uuid("Employee ID must be a valid UUID").optional(),
      status: z.enum(["ACTIVE", "RETURNED", "TRANSFERRED"]).optional(),
    }),
  }),
});
