const { z } = require("zod");

const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid("Session ID must be a valid UUID"),
});

const supportChatValidators = Object.freeze({
  sendMessage: Object.freeze({
    body: z.object({
      message: z.string({ required_error: "Message is required" })
        .trim()
        .min(1, "Message cannot be empty"),
    }),
  }),
  updateStatus: Object.freeze({
    params: sessionIdParamSchema,
    body: z.object({
      status: z.enum(["BOT", "ACTIVE", "CLOSED"], {
        errorMap: () => ({ message: "Status must be BOT, ACTIVE, or CLOSED" }),
      }),
    }),
  }),
  getSessionMessages: Object.freeze({
    params: sessionIdParamSchema,
  }),
});

module.exports = supportChatValidators;
