const { loadIntegrationHarness } = require("../helpers/integrationHarness");

describe("API integration: backend foundation and auth", () => {
  let harness;

  afterEach(() => {
    if (harness?.restoreEnv) {
      harness.restoreEnv();
    }
  });

  test("GET /api/health returns the standard success envelope", async () => {
    harness = await loadIntegrationHarness();

    const response = await harness.request.get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "OK",
      data: {
        status: "ok",
      },
    });
  });

  test("POST /api/auth/login returns VALIDATION_ERROR for an invalid payload", async () => {
    harness = await loadIntegrationHarness();

    const response = await harness.request.post("/api/auth/login").send({
      email: "not-an-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe("VALIDATION_ERROR");
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  test("shared Token Bucket exhaustion returns RATE_LIMIT_EXCEEDED", async () => {
    harness = await loadIntegrationHarness({
      envOverrides: {
        RATE_LIMIT_BUCKET_CAPACITY: 1,
        RATE_LIMIT_REFILL_TOKENS_PER_SECOND: 1,
        RATE_LIMIT_TOKENS_PER_REQUEST: 1,
      },
    });

    const firstResponse = await harness.request.post("/api/auth/login").send({
      email: "active.user@company.com",
      password: "Password123",
    });
    const secondResponse = await harness.request.post("/api/auth/login").send({
      email: "active.user@company.com",
      password: "Password123",
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
    expect(secondResponse.body).toMatchObject({
      success: false,
      message: "Too many requests. Please try again later.",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
    expect(secondResponse.headers["retry-after"]).toBe("1");
  });

  test("GET /api/health is never blocked by the shared Token Bucket", async () => {
    harness = await loadIntegrationHarness({
      envOverrides: {
        RATE_LIMIT_BUCKET_CAPACITY: 1,
        RATE_LIMIT_REFILL_TOKENS_PER_SECOND: 1,
        RATE_LIMIT_TOKENS_PER_REQUEST: 1,
      },
    });

    const rateLimitedResponse = await harness.request.post("/api/auth/login").send({
      email: "active.user@company.com",
      password: "Password123",
    });
    const blockedResponse = await harness.request.post("/api/auth/login").send({
      email: "active.user@company.com",
      password: "Password123",
    });
    const healthResponse = await harness.request.get("/api/health");

    expect(rateLimitedResponse.status).toBe(200);
    expect(blockedResponse.status).toBe(429);
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body.success).toBe(true);
  });

  test("POST /api/auth/login returns a JWT and safe user context on success", async () => {
    harness = await loadIntegrationHarness();

    const response = await harness.request.post("/api/auth/login").send({
      email: harness.seeds.credentials.activeUser.email,
      password: harness.seeds.credentials.activeUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login successful",
      data: {
        accessToken: expect.any(String),
        user: {
          id: harness.seeds.ids.activeUserId,
          email: harness.seeds.credentials.activeUser.email,
          role: "USER",
          employeeId: harness.seeds.ids.activeUserEmployeeId,
          mustChangePassword: false,
          isActive: true,
        },
      },
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.otpCodeHash).toBeUndefined();
  });

  test("GET /api/auth/me rejects missing bearer tokens", async () => {
    harness = await loadIntegrationHarness();

    const response = await harness.request.get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Unauthorized",
      errorCode: "AUTH_UNAUTHORIZED",
    });
  });

  test("GET /api/auth/me returns the current user for a valid token", async () => {
    harness = await loadIntegrationHarness();
    const userRecord = harness.getUserById(harness.seeds.ids.activeUserId);
    const token = harness.signTokenForUser(userRecord);

    const response = await harness.request
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Current user retrieved successfully",
      data: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        employeeId: userRecord.employeeId,
        mustChangePassword: userRecord.mustChangePassword,
        isActive: userRecord.isActive,
      },
    });
  });

  test("PUT /api/auth/change-password clears mustChangePassword after success", async () => {
    harness = await loadIntegrationHarness();
    const firstLoginUser = harness.getUserById(harness.seeds.ids.firstLoginUserId);
    const token = harness.signTokenForUser(firstLoginUser);

    const response = await harness.request
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: harness.seeds.credentials.firstLoginUser.password,
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Password changed successfully",
      data: {},
    });
    expect(harness.getUserById(firstLoginUser.id).mustChangePassword).toBe(false);
  });

  test("POST /api/auth/users rejects non-admin users", async () => {
    harness = await loadIntegrationHarness();
    const nonAdminUser = harness.getUserById(harness.seeds.ids.activeUserId);
    const token = harness.signTokenForUser(nonAdminUser);

    const response = await harness.request
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        employeeId: harness.seeds.ids.employeeWithoutUserId,
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      message: "Forbidden",
      errorCode: "AUTH_FORBIDDEN",
    });
  });

  test("POST /api/auth/users allows an admin to create a USER from an employee", async () => {
    harness = await loadIntegrationHarness();
    const adminUser = harness.getUserById(harness.seeds.ids.adminUserId);
    const token = harness.signTokenForUser(adminUser);

    const response = await harness.request
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        employeeId: harness.seeds.ids.employeeWithoutUserId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "User account created successfully",
      data: {
        email: "new.employee@company.com",
        role: "USER",
        employeeId: harness.seeds.ids.employeeWithoutUserId,
        mustChangePassword: true,
        isActive: true,
      },
    });
    expect(harness.getUserByEmail("new.employee@company.com")).toBeTruthy();
  });

  test("PATCH /api/auth/users/:id/status updates only isActive", async () => {
    harness = await loadIntegrationHarness();
    const adminUser = harness.getUserById(harness.seeds.ids.adminUserId);
    const token = harness.signTokenForUser(adminUser);

    const response = await harness.request
      .patch(`/api/auth/users/${harness.seeds.ids.activeUserId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "User status updated successfully",
      data: {
        id: harness.seeds.ids.activeUserId,
        isActive: false,
      },
    });
    expect(harness.getUserById(harness.seeds.ids.activeUserId).isActive).toBe(false);
  });

  test("POST /api/auth/forgot-password returns generic success for an unknown email", async () => {
    harness = await loadIntegrationHarness();

    const response = await harness.request.post("/api/auth/forgot-password").send({
      email: "unknown.user@company.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "OTP has been sent if the account is eligible",
      data: {},
    });
    expect(harness.sendMailMock).not.toHaveBeenCalled();
  });

  test("POST /api/auth/verify-forgot-password-otp verifies a valid OTP", async () => {
    harness = await loadIntegrationHarness();
    const { rawOtp } = await harness.seedOtpForUser({
      userId: harness.seeds.ids.activeUserId,
      rawOtp: "654321",
    });

    const response = await harness.request.post("/api/auth/verify-forgot-password-otp").send({
      email: harness.seeds.credentials.activeUser.email,
      otp: rawOtp,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "OTP verified successfully",
      data: {
        verified: true,
      },
    });
    expect(harness.state.passwordResetOtps[0].verifiedAt).toEqual(expect.any(Date));
  });

  test("POST /api/auth/reset-password rejects an unverified OTP", async () => {
    harness = await loadIntegrationHarness();
    const { rawOtp } = await harness.seedOtpForUser({
      userId: harness.seeds.ids.activeUserId,
      rawOtp: "222333",
      verifiedAt: null,
    });

    const response = await harness.request.post("/api/auth/reset-password").send({
      email: harness.seeds.credentials.activeUser.email,
      otp: rawOtp,
      newPassword: "ResetPassword123",
      confirmNewPassword: "ResetPassword123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "OTP has not been verified",
      errorCode: "AUTH_OTP_NOT_VERIFIED",
    });
  });

  test("POST /api/auth/reset-password succeeds for a verified OTP and marks it used", async () => {
    harness = await loadIntegrationHarness();
    const passwordUtils = require("../../../src/shared/utils/password.util");
    const { rawOtp, otpRecord } = await harness.seedOtpForUser({
      userId: harness.seeds.ids.activeUserId,
      rawOtp: "333444",
      verifiedAt: new Date(Date.now() - 1000),
    });

    const response = await harness.request.post("/api/auth/reset-password").send({
      email: harness.seeds.credentials.activeUser.email,
      otp: rawOtp,
      newPassword: "ResetPassword123",
      confirmNewPassword: "ResetPassword123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Password reset successfully",
      data: {},
    });
    expect(harness.getUserById(harness.seeds.ids.activeUserId).mustChangePassword).toBe(false);
    expect(harness.state.passwordResetOtps.find((candidate) => candidate.id === otpRecord.id).usedAt).toEqual(
      expect.any(Date),
    );
    await expect(
      passwordUtils.verifyPassword(
        "ResetPassword123",
        harness.getUserById(harness.seeds.ids.activeUserId).passwordHash,
      ),
    ).resolves.toBe(true);
  });

  test("normal protected routes remain available when mustChangePassword is true", async () => {
    harness = await loadIntegrationHarness();
    const firstLoginUser = harness.getUserById(harness.seeds.ids.firstLoginUserId);
    const token = harness.signTokenForUser(firstLoginUser);

    const response = await harness.request
      .get("/api/test/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Protected test route success",
      data: {
        ok: true,
      },
    });
  });
});
