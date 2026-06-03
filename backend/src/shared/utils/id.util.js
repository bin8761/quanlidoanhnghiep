const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidString(value) {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

function assertUuidString(value, fieldName) {
  if (!isUuidString(value)) {
    throw new TypeError(`${fieldName} must be a valid UUID`);
  }
}

module.exports = Object.freeze({
  UUID_REGEX,
  isUuidString,
  assertUuidString,
});
