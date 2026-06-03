function assertDate(value, fieldName) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError(`${fieldName} must be a valid Date instance`);
  }
}

function isBefore(leftDate, rightDate) {
  assertDate(leftDate, "leftDate");
  assertDate(rightDate, "rightDate");

  return leftDate.getTime() < rightDate.getTime();
}

function isAfter(leftDate, rightDate) {
  assertDate(leftDate, "leftDate");
  assertDate(rightDate, "rightDate");

  return leftDate.getTime() > rightDate.getTime();
}

function isExpired(expiresAt, currentDate = new Date()) {
  assertDate(expiresAt, "expiresAt");
  assertDate(currentDate, "currentDate");

  return expiresAt.getTime() <= currentDate.getTime();
}

function isNotExpired(expiresAt, currentDate = new Date()) {
  return !isExpired(expiresAt, currentDate);
}

module.exports = Object.freeze({
  isBefore,
  isAfter,
  isExpired,
  isNotExpired,
});
