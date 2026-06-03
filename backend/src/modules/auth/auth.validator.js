const { z } = require("zod");

const {
  AUTH_OTP_POLICY,
  AUTH_ERROR_MESSAGES,
  PASSWORD_POLICY,
} = require("./auth.constants");

const trimmedRequiredString = (fieldLabel) =>
  z.string().trim().min(1, `${fieldLabel} is required`);

const emailSchema = trimmedRequiredString("Email").email("Email must be a valid email address");

const passwordSchema = trimmedRequiredString("Password")
  .min(
    PASSWORD_POLICY.MIN_LENGTH,
    AUTH_ERROR_MESSAGES.PASSWORD_POLICY,
  )
  .regex(PASSWORD_POLICY.REQUIRES_LETTER_REGEX, AUTH_ERROR_MESSAGES.PASSWORD_POLICY)
  .regex(PASSWORD_POLICY.REQUIRES_NUMBER_REGEX, AUTH_ERROR_MESSAGES.PASSWORD_POLICY);

const otpSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${AUTH_OTP_POLICY.LENGTH}}$`), `OTP must be exactly ${AUTH_OTP_POLICY.LENGTH} digits`);

const uuidSchema = (fieldLabel) =>
  z.string().trim().uuid(`${fieldLabel} must be a valid UUID`);

const changePasswordBodySchema = z
  .object({
    currentPassword: trimmedRequiredString("Current password"),
    newPassword: passwordSchema,
    confirmNewPassword: trimmedRequiredString("Confirm new password"),
  })
  .superRefine((payload, context) => {
    if (payload.newPassword !== payload.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH,
      });
    }
  });

const resetPasswordBodySchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmNewPassword: trimmedRequiredString("Confirm new password"),
  })
  .superRefine((payload, context) => {
    if (payload.newPassword !== payload.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH,
      });
    }
  });

const authValidators = Object.freeze({
  login: Object.freeze({
    body: z.object({
      email: emailSchema,
      password: trimmedRequiredString("Password"),
    }),
  }),
  changePassword: Object.freeze({
    body: changePasswordBodySchema,
  }),
  forgotPassword: Object.freeze({
    body: z.object({
      email: emailSchema,
    }),
  }),
  verifyForgotPasswordOtp: Object.freeze({
    body: z.object({
      email: emailSchema,
      otp: otpSchema,
    }),
  }),
  resetPassword: Object.freeze({
    body: resetPasswordBodySchema,
  }),
  createUser: Object.freeze({
    body: z.object({
      employeeId: uuidSchema("Employee ID"),
    }),
  }),
  updateUserStatus: Object.freeze({
    params: z.object({
      id: uuidSchema("User ID"),
    }),
    body: z.object({
      isActive: z.boolean({
        invalid_type_error: "isActive must be a boolean",
        required_error: "isActive is required",
      }),
    }),
  }),
});

module.exports = authValidators;
