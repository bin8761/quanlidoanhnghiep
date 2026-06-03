const PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS = Object.freeze([
  "GET /api/auth/me",
  "PUT /api/auth/change-password",
  "POST /api/auth/logout",
]);

module.exports = Object.freeze({
  PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS,
});
