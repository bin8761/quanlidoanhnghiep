const { OTP_LENGTH, OTP_EXPIRES_SECONDS_DEFAULT, OTP_MAX_ATTEMPTS_DEFAULT } = require("../../shared/constants/otpPolicy");
const {
  PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS,
} = require("../../shared/constants/passwordChangeEndpoints");
const ROLES = require("../../shared/constants/roles");

const AUTH_ROUTE_PREFIX = "/auth";

const PASSWORD_POLICY = Object.freeze({
  MIN_LENGTH: 8,
  REQUIRES_LETTER_REGEX: /[A-Za-z]/,
  REQUIRES_NUMBER_REGEX: /\d/,
});

const AUTH_ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: "Invalid credentials",
  ACCOUNT_INACTIVE: "Account is inactive",
  PASSWORD_MISMATCH: "Password confirmation does not match",
  PASSWORD_POLICY: "Password must be at least 8 characters and include letters and numbers",
  INVALID_OTP: "Invalid OTP",
  OTP_EXPIRED: "OTP has expired",
  OTP_NOT_VERIFIED: "OTP has not been verified",
  OTP_ATTEMPT_LIMIT_EXCEEDED: "OTP attempt limit exceeded",
  OTP_RESEND_TOO_SOON: "A valid OTP already exists. Please wait before requesting a new OTP",
  OTP_DELIVERY_FAILED: "Unable to send OTP email at this time",
  PASSWORD_CHANGE_REQUIRED: "Password change is required before accessing this resource",
  USER_ALREADY_EXISTS: "User account already exists",
  USER_NOT_FOUND: "User account not found",
  EMPLOYEE_NOT_FOUND: "Employee not found",
  EMPLOYEE_EMAIL_MISMATCH: "Employee code and email do not match",
});

const AUTH_RESPONSE_MESSAGES = Object.freeze({
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful",
  LOGOUT_SUCCESS: "Logout successful",
  CURRENT_USER_SUCCESS: "Current user retrieved successfully",
  PASSWORD_CHANGED_SUCCESS: "Password changed successfully",
  FORGOT_PASSWORD_OTP_SENT: "OTP has been sent if the account is eligible",
  OTP_VERIFIED_SUCCESS: "OTP verified successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  USER_CREATED_SUCCESS: "User account created successfully",
  USER_STATUS_UPDATED_SUCCESS: "User status updated successfully",
});

const AUTH_OTP_POLICY = Object.freeze({
  LENGTH: OTP_LENGTH,
  EXPIRES_SECONDS: OTP_EXPIRES_SECONDS_DEFAULT,
  MAX_ATTEMPTS: OTP_MAX_ATTEMPTS_DEFAULT,
});

const CREATE_USER_ROLE = ROLES.USER;

module.exports = Object.freeze({
  AUTH_ROUTE_PREFIX,
  AUTH_ERROR_MESSAGES,
  AUTH_RESPONSE_MESSAGES,
  AUTH_OTP_POLICY,
  PASSWORD_POLICY,
  PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS,
  CREATE_USER_ROLE,
  ROLES,
});
