const supertest = require("supertest");

async function buildDefaultState() {
  const passwordUtils = require("../../../src/shared/utils/password.util");
  const otpUtils = require("../../../src/shared/utils/otp.util");

  const adminPassword = "AdminPass123";
  const firstLoginPassword = "Password123";
  const activeUserPassword = "Password123";
  const existingUserPassword = "Password123";

  const [
    adminPasswordHash,
    firstLoginPasswordHash,
    activeUserPasswordHash,
    existingUserPasswordHash,
  ] = await Promise.all([
    passwordUtils.hashPassword(adminPassword),
    passwordUtils.hashPassword(firstLoginPassword),
    passwordUtils.hashPassword(activeUserPassword),
    passwordUtils.hashPassword(existingUserPassword),
  ]);

  const ids = {
    employees: {
      noUser: "11111111-1111-4111-8111-111111111111",
      existing: "22222222-2222-4222-8222-222222222222",
      firstLogin: "33333333-3333-4333-8333-333333333333",
      active: "44444444-4444-4444-8444-444444444444",
    },
    users: {
      admin: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      existing: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      firstLogin: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      active: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    },
  };

  const now = new Date("2026-06-03T00:00:00.000Z");
  const employees = [
    {
      id: ids.employees.noUser,
      employeeCode: "EMP-201",
      fullName: "New Employee",
      email: "new.employee@company.com",
      departmentId: 1,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.employees.existing,
      employeeCode: "EMP-202",
      fullName: "Existing Employee",
      email: "existing.employee@company.com",
      departmentId: 1,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.employees.firstLogin,
      employeeCode: "EMP-203",
      fullName: "First Login User",
      email: "first.login@company.com",
      departmentId: 2,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.employees.active,
      employeeCode: "EMP-204",
      fullName: "Active User",
      email: "active.user@company.com",
      departmentId: 2,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const users = [
    {
      id: ids.users.admin,
      employeeId: null,
      email: "admin@company.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.users.existing,
      employeeId: ids.employees.existing,
      email: "existing.employee@company.com",
      passwordHash: existingUserPasswordHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.users.firstLogin,
      employeeId: ids.employees.firstLogin,
      email: "first.login@company.com",
      passwordHash: firstLoginPasswordHash,
      role: "USER",
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ids.users.active,
      employeeId: ids.employees.active,
      email: "active.user@company.com",
      passwordHash: activeUserPasswordHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const state = {
    employees,
    users,
    passwordResetOtps: [],
  };

  const seeds = {
    credentials: {
      admin: {
        email: "admin@company.com",
        password: adminPassword,
      },
      firstLoginUser: {
        email: "first.login@company.com",
        password: firstLoginPassword,
      },
      activeUser: {
        email: "active.user@company.com",
        password: activeUserPassword,
      },
      existingUser: {
        email: "existing.employee@company.com",
        password: existingUserPassword,
      },
    },
    ids: {
      adminUserId: ids.users.admin,
      employeeWithoutUserId: ids.employees.noUser,
      existingUserEmployeeId: ids.employees.existing,
      activeUserEmployeeId: ids.employees.active,
      firstLoginUserId: ids.users.firstLogin,
      activeUserId: ids.users.active,
    },
  };

  async function seedOtpForUser({
    userId,
    rawOtp = "123456",
    expiresAt = new Date(Date.now() + 60 * 1000),
    usedAt = null,
    verifiedAt = null,
    attemptCount = 0,
    createdAt = new Date(Date.now() - 1000),
    updatedAt = createdAt,
  }) {
    const otpCodeHash = await otpUtils.hashOtp(rawOtp);
    const nextId = `eeeeeeee-eeee-4eee-8eee-${String(state.passwordResetOtps.length + 1).padStart(12, "0")}`;
    const otpRecord = {
      id: nextId,
      userId,
      otpCodeHash,
      expiresAt,
      usedAt,
      verifiedAt,
      attemptCount,
      createdAt,
      updatedAt,
    };

    state.passwordResetOtps.push(otpRecord);

    return {
      rawOtp,
      otpRecord,
    };
  }

  return {
    state,
    seeds,
    seedOtpForUser,
  };
}

function cloneValue(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]),
    );
  }

  return value;
}

function applySelect(record, select) {
  if (!record) {
    return null;
  }

  if (!select || typeof select !== "object") {
    return cloneValue(record);
  }

  const selectedRecord = {};

  for (const [fieldName, isSelected] of Object.entries(select)) {
    if (isSelected) {
      selectedRecord[fieldName] = cloneValue(record[fieldName]);
    }
  }

  return selectedRecord;
}

function matchesComparator(fieldValue, comparator) {
  if (Object.prototype.hasOwnProperty.call(comparator, "gt")) {
    return fieldValue > comparator.gt;
  }

  if (Object.prototype.hasOwnProperty.call(comparator, "lt")) {
    return fieldValue < comparator.lt;
  }

  if (Object.prototype.hasOwnProperty.call(comparator, "not")) {
    return fieldValue !== comparator.not;
  }

  return false;
}

function matchesWhere(record, where = {}) {
  return Object.entries(where).every(([fieldName, expectedValue]) => {
    const actualValue = record[fieldName];

    if (
      expectedValue
      && typeof expectedValue === "object"
      && !Array.isArray(expectedValue)
      && !(expectedValue instanceof Date)
    ) {
      return matchesComparator(actualValue, expectedValue);
    }

    return actualValue === expectedValue;
  });
}

function sortRecords(records, orderBy = []) {
  const orderRules = Array.isArray(orderBy) ? orderBy : [orderBy];

  return [...records].sort((leftRecord, rightRecord) => {
    for (const orderRule of orderRules) {
      const [fieldName, direction] = Object.entries(orderRule)[0];
      const leftValue = leftRecord[fieldName];
      const rightValue = rightRecord[fieldName];

      if (leftValue === rightValue) {
        continue;
      }

      if (direction === "desc") {
        return leftValue > rightValue ? -1 : 1;
      }

      return leftValue > rightValue ? 1 : -1;
    }

    return 0;
  });
}

function createMockPrisma(state) {
  function nextUserId() {
    return `ffffffff-ffff-4fff-8fff-${String(state.users.length + 1).padStart(12, "0")}`;
  }

  return {
    user: {
      async findUnique({ where, select } = {}) {
        const userRecord = state.users.find((candidate) => matchesWhere(candidate, where));
        return applySelect(userRecord, select);
      },

      async update({ where, data, select } = {}) {
        const userRecord = state.users.find((candidate) => matchesWhere(candidate, where));

        if (!userRecord) {
          return null;
        }

        Object.assign(userRecord, cloneValue(data), {
          updatedAt: new Date("2026-06-03T00:00:00.000Z"),
        });

        return applySelect(userRecord, select);
      },

      async create({ data, select } = {}) {
        const now = new Date("2026-06-03T00:00:00.000Z");
        const userRecord = {
          id: nextUserId(),
          employeeId: data.employeeId ?? null,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          isActive: data.isActive,
          mustChangePassword: data.mustChangePassword,
          lastLoginAt: data.lastLoginAt ?? null,
          createdAt: now,
          updatedAt: now,
        };

        state.users.push(userRecord);

        return applySelect(userRecord, select);
      },
    },

    employee: {
      async findUnique({ where, select } = {}) {
        const employeeRecord = state.employees.find((candidate) => matchesWhere(candidate, where));
        return applySelect(employeeRecord, select);
      },
    },

    passwordResetOtp: {
      async findFirst({ where, orderBy, select } = {}) {
        const matchingRecords = state.passwordResetOtps.filter((candidate) =>
          matchesWhere(candidate, where),
        );
        const sortedRecords = sortRecords(matchingRecords, orderBy);

        return applySelect(sortedRecords[0], select);
      },

      async create({ data, select } = {}) {
        const now = new Date("2026-06-03T00:00:00.000Z");
        const nextId = `eeeeeeee-eeee-4eee-8eee-${String(state.passwordResetOtps.length + 1).padStart(12, "0")}`;
        const otpRecord = {
          id: nextId,
          userId: data.userId,
          otpCodeHash: data.otpCodeHash,
          expiresAt: data.expiresAt,
          usedAt: data.usedAt ?? null,
          verifiedAt: data.verifiedAt ?? null,
          attemptCount: data.attemptCount ?? 0,
          createdAt: now,
          updatedAt: now,
        };

        state.passwordResetOtps.push(otpRecord);

        return applySelect(otpRecord, select);
      },

      async update({ where, data, select } = {}) {
        const otpRecord = state.passwordResetOtps.find((candidate) => matchesWhere(candidate, where));

        if (!otpRecord) {
          return null;
        }

        if (
          data.attemptCount
          && typeof data.attemptCount === "object"
          && Number.isInteger(data.attemptCount.increment)
        ) {
          otpRecord.attemptCount += data.attemptCount.increment;
        }

        for (const [fieldName, fieldValue] of Object.entries(data)) {
          if (fieldName === "attemptCount" && typeof fieldValue === "object") {
            continue;
          }

          otpRecord[fieldName] = cloneValue(fieldValue);
        }

        otpRecord.updatedAt = new Date("2026-06-03T00:00:00.000Z");

        return applySelect(otpRecord, select);
      },

      async updateMany({ where, data } = {}) {
        let count = 0;

        for (const otpRecord of state.passwordResetOtps) {
          if (!matchesWhere(otpRecord, where)) {
            continue;
          }

          Object.assign(otpRecord, cloneValue(data), {
            updatedAt: new Date("2026-06-03T00:00:00.000Z"),
          });
          count += 1;
        }

        return { count };
      },
    },
  };
}

async function loadIntegrationHarness({
  envOverrides = {},
  includeProtectedTestRoute = true,
} = {}) {
  const previousEnv = {};

  for (const [key, value] of Object.entries(envOverrides)) {
    previousEnv[key] = process.env[key];
    process.env[key] = String(value);
  }

  jest.resetModules();

  const { state, seeds, seedOtpForUser } = await buildDefaultState();
  const prisma = createMockPrisma(state);
  const sendMailMock = jest.fn().mockResolvedValue({
    messageId: "smtp-message-id",
    accepted: ["accepted@example.com"],
    rejected: [],
    response: "250 OK",
  });
  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const createTransportMock = jest.fn(() => ({
    sendMail: sendMailMock,
  }));

  jest.doMock("nodemailer", () => ({
    createTransport: createTransportMock,
  }));
  jest.doMock("uuid", () => ({
    v4: jest.fn(() => "integration-test-request-id"),
  }));
  jest.doMock("../../../src/config/logger", () => loggerMock);
  jest.doMock("../../../src/config/database", () => prisma);
  jest.doMock("../../../src/middlewares/errorHandler", () => {
    const actualErrorHandler = jest.requireActual("../../../src/middlewares/errorHandler");

    return function integrationErrorHandler(error, req, res, next) {
      global.__integrationLastError = error;

      if (process.env.DEBUG_INTEGRATION_ERRORS === "1") {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      return actualErrorHandler(error, req, res, next);
    };
  });

  const app = require("../../../src/app/app");
  const errorHandler = require("../../../src/middlewares/errorHandler");
  const authenticate = require("../../../src/middlewares/authenticate");
  const passwordChangeGuard = require("../../../src/middlewares/passwordChangeGuard");
  const createTokenBucketRateLimit = require("../../../src/middlewares/tokenBucketRateLimit");
  const { sendSuccess } = require("../../../src/shared/response/apiResponse");
  const tokenUtils = require("../../../src/shared/utils/token.util");

  if (includeProtectedTestRoute) {
    app.get(
      "/api/test/protected",
      createTokenBucketRateLimit(),
      authenticate,
      passwordChangeGuard,
      (req, res) =>
        sendSuccess(res, {
          statusCode: 200,
          message: "Protected test route success",
          data: {
            ok: true,
          },
        }),
    );
    app.use(errorHandler);
  }

  return {
    app,
    request: supertest(app),
    state,
    seeds,
    prisma,
    sendMailMock,
    createTransportMock,
    loggerMock,
    seedOtpForUser,
    signTokenForUser(userRecord) {
      return tokenUtils.signAccessToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
      });
    },
    getUserById(userId) {
      return state.users.find((userRecord) => userRecord.id === userId);
    },
    getUserByEmail(email) {
      return state.users.find((userRecord) => userRecord.email === email);
    },
    getEmployeeById(employeeId) {
      return state.employees.find((employeeRecord) => employeeRecord.id === employeeId);
    },
    restoreEnv() {
      for (const [key, previousValue] of Object.entries(previousEnv)) {
        if (typeof previousValue === "undefined") {
          delete process.env[key];
          continue;
        }

        process.env[key] = previousValue;
      }
    },
  };
}

module.exports = {
  loadIntegrationHarness,
};
