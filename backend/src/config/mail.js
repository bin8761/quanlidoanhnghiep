const nodemailer = require("nodemailer");
const env = require("./env");
const logger = require("./logger");

const OTP_MAIL_SUBJECT = "Your password reset OTP";

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

function buildMailTransportConfig(config = env) {
  return {
    host: config.mailHost,
    port: config.mailPort,
    secure: config.mailSecure,
    auth: {
      user: config.mailUser,
      pass: config.mailPassword,
    },
  };
}

function createMailTransport({
  config = env,
  transporterFactory = nodemailer.createTransport,
} = {}) {
  return transporterFactory(buildMailTransportConfig(config));
}

function summarizeSmtpResult(result) {
  return {
    messageId: result?.messageId,
    acceptedCount: Array.isArray(result?.accepted) ? result.accepted.length : undefined,
    rejectedCount: Array.isArray(result?.rejected) ? result.rejected.length : undefined,
    response: typeof result?.response === "string" ? result.response : undefined,
  };
}

function summarizeMailError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
  };
}

function buildForgotPasswordOtpMail({ otp, expiresInSeconds }) {
  assertNonEmptyString(otp, "otp");

  return {
    subject: OTP_MAIL_SUBJECT,
    text: [
      "You requested a password reset for your Enterprise Asset Management account.",
      `Your OTP is: ${otp}`,
      `This OTP expires in ${expiresInSeconds} seconds.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
    html: [
      "<p>You requested a password reset for your Enterprise Asset Management account.</p>",
      `<p><strong>Your OTP is: ${otp}</strong></p>`,
      `<p>This OTP expires in ${expiresInSeconds} seconds.</p>`,
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  };
}

function createMailService({
  transporter = createMailTransport(),
  from = env.mailFrom,
  loggerInstance = logger,
} = {}) {
  return Object.freeze({
    async sendForgotPasswordOtp({
      toEmail,
      otp,
      expiresInSeconds,
      requestId,
      userId,
    }) {
      assertNonEmptyString(toEmail, "toEmail");

      const mailContent = buildForgotPasswordOtpMail({
        otp,
        expiresInSeconds,
      });

      try {
        const result = await transporter.sendMail({
          from,
          to: toEmail,
          subject: mailContent.subject,
          text: mailContent.text,
          html: mailContent.html,
        });

        loggerInstance.info(
          {
            requestId,
            authEvent: "forgot_password_otp_email_sent",
            user: {
              userId,
            },
            mail: summarizeSmtpResult(result),
          },
          "Forgot-password OTP email sent successfully",
        );

        return result;
      } catch (error) {
        loggerInstance.error(
          {
            requestId,
            authEvent: "forgot_password_otp_email_failed",
            user: {
              userId,
            },
            mailError: summarizeMailError(error),
          },
          "Forgot-password OTP email delivery failed",
        );

        throw error;
      }
    },
  });
}

const mailService = createMailService();

module.exports = Object.freeze({
  OTP_MAIL_SUBJECT,
  buildMailTransportConfig,
  createMailTransport,
  summarizeSmtpResult,
  summarizeMailError,
  buildForgotPasswordOtpMail,
  createMailService,
  sendForgotPasswordOtp: mailService.sendForgotPasswordOtp,
});
