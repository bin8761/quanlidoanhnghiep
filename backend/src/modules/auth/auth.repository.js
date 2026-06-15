const { OTP_MAX_ATTEMPTS_DEFAULT } = require("../../shared/constants/otpPolicy");

const EMPLOYEE_AUTH_SELECT = Object.freeze({
  id: true,
  employeeCode: true,
  fullName: true,
  avatarUrl: true,
  email: true,
  departmentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

const USER_AUTH_SELECT = Object.freeze({
  id: true,
  employeeId: true,
  email: true,
  passwordHash: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: EMPLOYEE_AUTH_SELECT,
  },
});

const PASSWORD_RESET_OTP_SELECT = Object.freeze({
  id: true,
  userId: true,
  otpCodeHash: true,
  expiresAt: true,
  usedAt: true,
  verifiedAt: true,
  attemptCount: true,
  createdAt: true,
  updatedAt: true,
});

function mapUserForAuth(userRecord) {
  if (!userRecord) {
    return null;
  }

  return {
    id: userRecord.id,
    employeeId: userRecord.employeeId,
    email: userRecord.email,
    passwordHash: userRecord.passwordHash,
    role: userRecord.role,
    isActive: userRecord.isActive,
    mustChangePassword: userRecord.mustChangePassword,
    lastLoginAt: userRecord.lastLoginAt,
    createdAt: userRecord.createdAt,
    updatedAt: userRecord.updatedAt,
    employee: mapEmployeeForAuth(userRecord.employee),
  };
}

function mapEmployeeForAuth(employeeRecord) {
  if (!employeeRecord) {
    return null;
  }

  return {
    id: employeeRecord.id,
    employeeCode: employeeRecord.employeeCode,
    fullName: employeeRecord.fullName,
    avatarUrl: employeeRecord.avatarUrl,
    email: employeeRecord.email,
    departmentId: employeeRecord.departmentId,
    status: employeeRecord.status,
    createdAt: employeeRecord.createdAt,
    updatedAt: employeeRecord.updatedAt,
  };
}

function mapPasswordResetOtpForAuth(passwordResetOtpRecord) {
  if (!passwordResetOtpRecord) {
    return null;
  }

  return {
    id: passwordResetOtpRecord.id,
    userId: passwordResetOtpRecord.userId,
    otpCodeHash: passwordResetOtpRecord.otpCodeHash,
    expiresAt: passwordResetOtpRecord.expiresAt,
    usedAt: passwordResetOtpRecord.usedAt,
    verifiedAt: passwordResetOtpRecord.verifiedAt,
    attemptCount: passwordResetOtpRecord.attemptCount,
    createdAt: passwordResetOtpRecord.createdAt,
    updatedAt: passwordResetOtpRecord.updatedAt,
  };
}

function resolvePrismaClient(prismaClient) {
  if (prismaClient) {
    return prismaClient;
  }

  return require("../../config/database");
}

function buildActiveOtpWhereClause(userId, options = {}) {
  const currentTime = options.currentTime ?? new Date();
  const maxAttempts = options.maxAttempts ?? OTP_MAX_ATTEMPTS_DEFAULT;
  const whereClause = {
    userId,
    usedAt: null,
    expiresAt: {
      gt: currentTime,
    },
    attemptCount: {
      lt: maxAttempts,
    },
  };

  if (Object.prototype.hasOwnProperty.call(options, "excludeOtpId")) {
    whereClause.id = {
      not: options.excludeOtpId,
    };
  }

  return whereClause;
}

function buildLatestOtpForVerificationWhereClause(userId) {
  return {
    userId,
    usedAt: null,
  };
}

function createAuthRepository(prismaClient) {
  return Object.freeze({
    async findUserByEmail(email) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const userRecord = await activePrismaClient.user.findUnique({
        where: {
          email,
        },
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async findUserById(userId) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const userRecord = await activePrismaClient.user.findUnique({
        where: {
          id: userId,
        },
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async updateLastLoginAt(userId, lastLoginAt = new Date()) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const userRecord = await activePrismaClient.user.update({
        where: {
          id: userId,
        },
        data: {
          lastLoginAt,
        },
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async updateUserPassword(userId, passwordHash, options = {}) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const updateData = {
        passwordHash,
      };

      if (Object.prototype.hasOwnProperty.call(options, "mustChangePassword")) {
        updateData.mustChangePassword = options.mustChangePassword;
      }

      const userRecord = await activePrismaClient.user.update({
        where: {
          id: userId,
        },
        data: updateData,
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async updateUserStatus(userId, isActive) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const userRecord = await activePrismaClient.user.update({
        where: {
          id: userId,
        },
        data: {
          isActive,
        },
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async findEmployeeById(employeeId) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const employeeRecord = await activePrismaClient.employee.findUnique({
        where: {
          id: employeeId,
        },
        select: EMPLOYEE_AUTH_SELECT,
      });

      return mapEmployeeForAuth(employeeRecord);
    },

    async findEmployeeByCode(employeeCode) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const employeeRecord = await activePrismaClient.employee.findUnique({
        where: {
          employeeCode,
        },
        select: EMPLOYEE_AUTH_SELECT,
      });

      return mapEmployeeForAuth(employeeRecord);
    },

    async createUser(userData) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const userRecord = await activePrismaClient.user.create({
        data: {
          employeeId: userData.employeeId,
          email: userData.email,
          passwordHash: userData.passwordHash,
          role: userData.role,
          isActive: userData.isActive,
          mustChangePassword: userData.mustChangePassword,
          lastLoginAt: userData.lastLoginAt ?? null,
        },
        select: USER_AUTH_SELECT,
      });

      return mapUserForAuth(userRecord);
    },

    async hasUserWithEmail(email) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const duplicateUser = await activePrismaClient.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      return Boolean(duplicateUser);
    },

    async hasUserForEmployee(employeeId) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const duplicateUser = await activePrismaClient.user.findUnique({
        where: {
          employeeId,
        },
        select: {
          id: true,
        },
      });

      return Boolean(duplicateUser);
    },

    async createPasswordResetOtp(otpData) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.create({
        data: {
          userId: otpData.userId,
          otpCodeHash: otpData.otpCodeHash,
          expiresAt: otpData.expiresAt,
          usedAt: otpData.usedAt ?? null,
          verifiedAt: otpData.verifiedAt ?? null,
          attemptCount: otpData.attemptCount ?? 0,
        },
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },

    async findLatestActiveOtpByUserId(userId, options = {}) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.findFirst({
        where: buildActiveOtpWhereClause(userId, options),
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },

    async findLatestOtpForVerificationByUserId(userId) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.findFirst({
        where: buildLatestOtpForVerificationWhereClause(userId),
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },

    async invalidateOlderActiveOtps(userId, options = {}) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const usedAt = options.usedAt ?? new Date();
      const result = await activePrismaClient.passwordResetOtp.updateMany({
        where: buildActiveOtpWhereClause(userId, options),
        data: {
          usedAt,
        },
      });

      return result.count;
    },

    async incrementOtpAttemptCount(otpId) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.update({
        where: {
          id: otpId,
        },
        data: {
          attemptCount: {
            increment: 1,
          },
        },
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },

    async markOtpAsVerified(otpId, verifiedAt = new Date()) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.update({
        where: {
          id: otpId,
        },
        data: {
          verifiedAt,
        },
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },

    async markOtpAsUsed(otpId, usedAt = new Date()) {
      const activePrismaClient = resolvePrismaClient(prismaClient);
      const passwordResetOtpRecord = await activePrismaClient.passwordResetOtp.update({
        where: {
          id: otpId,
        },
        data: {
          usedAt,
        },
        select: PASSWORD_RESET_OTP_SELECT,
      });

      return mapPasswordResetOtpForAuth(passwordResetOtpRecord);
    },
  });
}

const authRepository = createAuthRepository();

module.exports = Object.freeze({
  ...authRepository,
  createAuthRepository,
  resolvePrismaClient,
  USER_AUTH_SELECT,
  EMPLOYEE_AUTH_SELECT,
  PASSWORD_RESET_OTP_SELECT,
  mapUserForAuth,
  mapEmployeeForAuth,
  mapPasswordResetOtpForAuth,
  buildActiveOtpWhereClause,
  buildLatestOtpForVerificationWhereClause,
});
