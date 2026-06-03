const bcrypt = require("bcrypt");
const crypto = require("crypto");

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = 10;
const OTP_EXPIRES_SECONDS = 60;
const OTP_MIN_VALUE = 0;
const OTP_MAX_EXCLUSIVE = 10 ** OTP_LENGTH;

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${fieldName} must be a positive integer`);
  }
}

function assertDate(value, fieldName) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError(`${fieldName} must be a valid Date instance`);
  }
}

function generateOtp() {
  return crypto.randomInt(OTP_MIN_VALUE, OTP_MAX_EXCLUSIVE).toString().padStart(OTP_LENGTH, "0");
}

async function hashOtp(rawOtp) {
  assertNonEmptyString(rawOtp, "rawOtp");

  return bcrypt.hash(rawOtp, OTP_SALT_ROUNDS);
}

async function verifyOtp(rawOtp, otpHash) {
  assertNonEmptyString(rawOtp, "rawOtp");
  assertNonEmptyString(otpHash, "otpHash");

  return bcrypt.compare(rawOtp, otpHash);
}

function calculateOtpExpiresAt({
  currentDate = new Date(),
  expiresInSeconds = OTP_EXPIRES_SECONDS,
} = {}) {
  assertDate(currentDate, "currentDate");
  assertPositiveInteger(expiresInSeconds, "expiresInSeconds");

  return new Date(currentDate.getTime() + expiresInSeconds * 1000);
}

module.exports = Object.freeze({
  OTP_LENGTH,
  OTP_SALT_ROUNDS,
  OTP_EXPIRES_SECONDS,
  generateOtp,
  hashOtp,
  verifyOtp,
  calculateOtpExpiresAt,
});
