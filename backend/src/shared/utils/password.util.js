const bcrypt = require("bcrypt");

const PASSWORD_SALT_ROUNDS = 10;

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

async function hashPassword(plainPassword) {
  assertNonEmptyString(plainPassword, "plainPassword");

  return bcrypt.hash(plainPassword, PASSWORD_SALT_ROUNDS);
}

async function verifyPassword(plainPassword, passwordHash) {
  assertNonEmptyString(plainPassword, "plainPassword");
  assertNonEmptyString(passwordHash, "passwordHash");

  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = Object.freeze({
  PASSWORD_SALT_ROUNDS,
  hashPassword,
  verifyPassword,
});
