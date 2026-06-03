// Safe JSON parse
let json = {};
try { json = pm.response.json(); } catch (e) { json = {}; }

const data = json?.data || {};
const nestedUser = data?.user || {};
const directUser = (data && typeof data === "object" && data.id) ? data : {};
const user = nestedUser.id ? nestedUser : directUser;

// Tokens
if (data?.accessToken) pm.environment.set("accessToken", data.accessToken);

// Save role-specific token after login
if (data?.accessToken && user?.role === "ADMIN") {
  pm.environment.set("adminToken", data.accessToken);
}
if (data?.accessToken && user?.role === "USER") {
  pm.environment.set("userToken", data.accessToken);
}

// User fields from either login.data.user or direct data object
if (user?.id) {
  pm.environment.set("userId", String(user.id));
  pm.environment.set("id", String(user.id));
  pm.environment.set("targetUserId", String(user.id));
}
if (user?.id && pm.info.requestName === "POST Create Employee User") {
  pm.environment.set("createdUserId", String(user.id));
  pm.environment.set("targetUserId", String(user.id));
}
if (user?.email) pm.environment.set("savedUserEmail", user.email);
if (user?.employeeId) pm.environment.set("employeeId", String(user.employeeId));
if (typeof user?.mustChangePassword === "boolean") {
  pm.environment.set("mustChangePassword", String(user.mustChangePassword));
}
if (typeof user?.isActive === "boolean") {
  pm.environment.set("isActive", String(user.isActive));
}
if (user?.role) pm.environment.set("role", user.role);

// Useful flags from forgot-password / OTP APIs
if (typeof data?.verified === "boolean") {
  pm.environment.set("otpVerified", String(data.verified));
}
if (typeof data?.requested === "boolean") {
  pm.environment.set("otpRequested", String(data.requested));
}

// Error / response metadata
if (json?.requestId) pm.environment.set("requestId", json.requestId);
if (json?.errorCode) pm.environment.set("lastErrorCode", json.errorCode);
if (json?.message) pm.environment.set("lastMessage", json.message);

// Optional assertion only for successful responses
if (pm.response.code >= 200 && pm.response.code < 300) {
  pm.test("Status code 2xx", function () {
    pm.expect(pm.response.code).to.be.within(200, 299);
  });
}
