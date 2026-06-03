module.exports = Object.freeze({
  OTP_LENGTH: 6,
  OTP_EXPIRES_SECONDS_DEFAULT: 60,
  OTP_MAX_ATTEMPTS_DEFAULT: 3,
  OTP_RESEND_ENDPOINT_KEY: "POST /api/auth/forgot-password",
});
