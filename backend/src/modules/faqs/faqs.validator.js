const { z } = require("zod");

const faqValidators = {
  create: z.object({
    body: z.object({
      question: z.string({ required_error: "Question is required" }).min(5, "Question must be at least 5 characters"),
      answer: z.string({ required_error: "Answer is required" }).min(5, "Answer must be at least 5 characters"),
      category: z.string({ required_error: "Category is required" }).min(2, "Category must be at least 2 characters"),
      status: z.enum(["SHOW", "HIDE"]).optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: z.string().uuid("Invalid FAQ ID"),
    }),
    body: z.object({
      question: z.string().min(5).optional(),
      answer: z.string().min(5).optional(),
      category: z.string().min(2).optional(),
      status: z.enum(["SHOW", "HIDE"]).optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: z.string().uuid("Invalid FAQ ID"),
    }),
  }),
};

module.exports = faqValidators;
