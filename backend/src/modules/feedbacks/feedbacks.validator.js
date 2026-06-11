const { z } = require("zod");

const feedbackValidators = {
  create: z.object({
    body: z.object({
      title: z.string({ required_error: "Title is required" }).min(3, "Title must be at least 3 characters"),
      content: z.string({ required_error: "Content is required" }).min(5, "Content must be at least 5 characters"),
      category: z.string({ required_error: "Category is required" }),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    }),
  }),

  updateStatus: z.object({
    params: z.object({
      id: z.string().uuid("Invalid Feedback ID"),
    }),
    body: z.object({
      status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]),
      adminNote: z.string().optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: z.string().uuid("Invalid Feedback ID"),
    }),
  }),
};

module.exports = feedbackValidators;
