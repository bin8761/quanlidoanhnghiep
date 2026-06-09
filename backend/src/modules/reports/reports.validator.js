const { z } = require("zod");

const status = z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "BROKEN", "LOST", "DISPOSED"]);
const issue = z.enum([
  "ASSIGNED_WITHOUT_ACTIVE_ASSIGNMENT",
  "ACTIVE_ASSIGNMENT_STATUS_MISMATCH",
  "MULTIPLE_ACTIVE_ASSIGNMENTS",
  "INVALID_STATUS_WITH_ACTIVE_ASSIGNMENT",
  "MISSING_OWNER_DEPARTMENT",
  "MISSING_LOCATION",
  "MISSING_SERIAL_NUMBER",
  "DUPLICATE_SERIAL_NUMBER",
]);
const dateString = z.string().date();

function validateRange(query, ctx) {
  if (!query.from || !query.to) return;
  const from = new Date(`${query.from}T00:00:00.000Z`);
  const to = new Date(`${query.to}T23:59:59.999Z`);
  const maximum = new Date(from);
  maximum.setUTCMonth(maximum.getUTCMonth() + 24);
  if (to < from) ctx.addIssue({ code: "custom", path: ["to"], message: "To date must be after from date" });
  if (to > maximum) ctx.addIssue({ code: "custom", path: ["to"], message: "Report range must not exceed 24 months" });
}

const commonQuery = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  ownerDepartmentId: z.coerce.number().int().positive().optional(),
  usageDepartmentId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  status: status.optional(),
}).superRefine(validateRange);

module.exports = Object.freeze({
  common: { query: commonQuery },
  department: { query: commonQuery.and(z.object({ dimension: z.enum(["owner", "usage"]).default("usage") })) },
  assets: {
    query: commonQuery.and(z.object({
      issue: issue.optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })),
  },
});
