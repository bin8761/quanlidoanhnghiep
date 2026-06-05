const authRepository = require("./auth.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const passwordUtils = require("../../shared/utils/password.util");
const otpUtils = require("../../shared/utils/otp.util");
const tokenUtils = require("../../shared/utils/token.util");
const dateUtils = require("../../shared/utils/date.util");
const env = require("../../config/env");
const logger = require("../../config/logger");
const mailer = require("../../config/mail");
const { isUuidString } = require("../../shared/utils/id.util");
const {
  AUTH_ERROR_MESSAGES,
  AUTH_OTP_POLICY,
  PASSWORD_POLICY,
  ROLES,
} = require("./auth.constants");

function createInvalidCredentialsError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
  });
}

function createInactiveAccountError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.ACCOUNT_INACTIVE,
    statusCode: 403,
    errorCode: ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
  });
}

function createUnauthorizedError() {
  return new AppError({
    message: "Unauthorized",
    statusCode: 401,
    errorCode: ERROR_CODES.AUTH_UNAUTHORIZED,
  });
}

function createUserNotFoundError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
    statusCode: 404,
    errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
  });
}

function createEmployeeNotFoundError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.EMPLOYEE_NOT_FOUND,
    statusCode: 404,
    errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
  });
}

function createEmployeeEmailMismatchError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.EMPLOYEE_EMAIL_MISMATCH,
    statusCode: 400,
    errorCode: ERROR_CODES.AUTH_EMPLOYEE_EMAIL_MISMATCH,
  });
}

function createUserAlreadyExistsError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.USER_ALREADY_EXISTS,
    statusCode: 409,
    errorCode: ERROR_CODES.AUTH_USER_ALREADY_EXISTS,
  });
}

function createPasswordMismatchError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH,
    statusCode: 400,
    errorCode: ERROR_CODES.AUTH_PASSWORD_MISMATCH,
  });
}

function createPasswordPolicyError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.PASSWORD_POLICY,
    statusCode: 400,
    errorCode: ERROR_CODES.VALIDATION_ERROR,
  });
}

function createOtpResendTooSoonError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.OTP_RESEND_TOO_SOON,
    statusCode: 429,
    errorCode: ERROR_CODES.AUTH_OTP_RESEND_TOO_SOON,
  });
}

function createOtpDeliveryFailedError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.OTP_DELIVERY_FAILED,
    statusCode: 500,
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  });
}

function createInvalidOtpError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.INVALID_OTP,
    statusCode: 400,
    errorCode: ERROR_CODES.AUTH_INVALID_OTP,
  });
}

function createOtpExpiredError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.OTP_EXPIRED,
    statusCode: 400,
    errorCode: ERROR_CODES.AUTH_OTP_EXPIRED,
  });
}

function createOtpAttemptLimitExceededError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.OTP_ATTEMPT_LIMIT_EXCEEDED,
    statusCode: 429,
    errorCode: ERROR_CODES.AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED,
  });
}

function createOtpNotVerifiedError() {
  return new AppError({
    message: AUTH_ERROR_MESSAGES.OTP_NOT_VERIFIED,
    statusCode: 400,
    errorCode: ERROR_CODES.AUTH_OTP_NOT_VERIFIED,
  });
}

function passwordMeetsPolicy(password) {
  return (
    typeof password === "string"
    && password.length >= PASSWORD_POLICY.MIN_LENGTH
    && PASSWORD_POLICY.REQUIRES_LETTER_REGEX.test(password)
    && PASSWORD_POLICY.REQUIRES_NUMBER_REGEX.test(password)
  );
}

function mapUserToSafeAuthResponse(userRecord) {
  if (!userRecord) {
    return null;
  }

  return {
    id: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
    employeeId: userRecord.employeeId,
    mustChangePassword: userRecord.mustChangePassword,
    isActive: userRecord.isActive,
  };
}

function mapLoginToSafeAuthResponse(accessToken, userRecord) {
  return {
    accessToken,
    user: mapUserToSafeAuthResponse(userRecord),
  };
}

function isEligibleForgotPasswordUser(userRecord) {
  return Boolean(
    userRecord
    && userRecord.role === ROLES.USER
    && userRecord.isActive === true,
  );
}

function createAuthService({
  repository = authRepository,
  passwordUtility = passwordUtils,
  otpUtility = otpUtils,
  tokenUtility = tokenUtils,
  mailService = mailer,
  nowProvider = () => new Date(),
  defaultUserPassword = env.defaultUserPassword,
} = {}) {
  return Object.freeze({
    async register(payload = {}) {
      const {
        employeeCode,
        email,
        password,
        confirmPassword,
      } = payload;

      if (password !== confirmPassword) {
        throw createPasswordMismatchError();
      }

      if (!passwordMeetsPolicy(password)) {
        throw createPasswordPolicyError();
      }

      const employeeRecord = await repository.findEmployeeByCode(employeeCode);

      if (!employeeRecord) {
        throw createEmployeeNotFoundError();
      }

      if (employeeRecord.email.toLowerCase() !== email.toLowerCase()) {
        throw createEmployeeEmailMismatchError();
      }

      const [duplicateEmployeeAccount, duplicateEmailAccount] = await Promise.all([
        repository.hasUserForEmployee(employeeRecord.id),
        repository.hasUserWithEmail(employeeRecord.email),
      ]);

      if (duplicateEmployeeAccount || duplicateEmailAccount) {
        throw createUserAlreadyExistsError();
      }

      const passwordHash = await passwordUtility.hashPassword(password);
      const createdUser = await repository.createUser({
        employeeId: employeeRecord.id,
        email: employeeRecord.email,
        passwordHash,
        role: ROLES.USER,
        isActive: true,
        mustChangePassword: false,
      });

      return mapUserToSafeAuthResponse(createdUser);
    },

    async login(email, password) {
      const userRecord = await repository.findUserByEmail(email);

      if (!userRecord) {
        throw createInvalidCredentialsError();
      }

      const passwordMatches = await passwordUtility.verifyPassword(
        password,
        userRecord.passwordHash,
      );

      if (!passwordMatches) {
        throw createInvalidCredentialsError();
      }

      if (!userRecord.isActive) {
        throw createInactiveAccountError();
      }

      const accessToken = tokenUtility.signAccessToken({
        userId: userRecord.id,
        role: userRecord.role,
        email: userRecord.email,
      });
      const updatedUserRecord = await repository.updateLastLoginAt(userRecord.id);

      return mapLoginToSafeAuthResponse(accessToken, updatedUserRecord);
    },

    async getCurrentUser(authenticatedUser) {
      const userId = authenticatedUser?.userId;

      if (!isUuidString(userId)) {
        throw createUnauthorizedError();
      }

      const userRecord = await repository.findUserById(userId);

      if (!userRecord) {
        throw createUserNotFoundError();
      }

      return mapUserToSafeAuthResponse(userRecord);
    },

    async logout(authenticatedUser, context = {}) {
      const userId = authenticatedUser?.userId;

      if (!isUuidString(userId)) {
        throw createUnauthorizedError();
      }

      // MVP logout is a client-side token removal event only; JWT revocation is out of scope.
      logger.info(
        {
          requestId: context.requestId,
          user: {
            userId,
            email: authenticatedUser.email,
            role: authenticatedUser.role,
          },
          authEvent: "logout",
          tokenRevocationApplied: false,
        },
        "Logout successful; issued JWTs are not revoked in this MVP",
      );
    },

    async changePassword(authenticatedUser, passwordPayload = {}) {
      const userId = authenticatedUser?.userId;

      if (!isUuidString(userId)) {
        throw createUnauthorizedError();
      }

      const {
        currentPassword,
        newPassword,
        confirmNewPassword,
      } = passwordPayload;

      if (newPassword !== confirmNewPassword) {
        throw createPasswordMismatchError();
      }

      if (!passwordMeetsPolicy(newPassword)) {
        throw createPasswordPolicyError();
      }

      const userRecord = await repository.findUserById(userId);

      if (!userRecord) {
        throw createUserNotFoundError();
      }

      const currentPasswordMatches = await passwordUtility.verifyPassword(
        currentPassword,
        userRecord.passwordHash,
      );

      if (!currentPasswordMatches) {
        throw createPasswordMismatchError();
      }

      const nextPasswordHash = await passwordUtility.hashPassword(newPassword);

      await repository.updateUserPassword(userId, nextPasswordHash, {
        mustChangePassword: false,
      });
    },

    async requestForgotPasswordOtp(payload = {}) {
      const { email, requestId } = payload;
      const userRecord = await repository.findUserByEmail(email);

      if (!userRecord) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_requested",
            outcome: "generic_success",
            reason: "unknown_account",
          },
          "Forgot-password request completed with generic success",
        );

        return {
          requested: true,
        };
      }

      if (userRecord.role === ROLES.ADMIN) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_requested",
            outcome: "generic_success",
            reason: "admin_out_of_scope",
          },
          "Forgot-password request completed with generic success",
        );

        return {
          requested: true,
        };
      }

      if (!isEligibleForgotPasswordUser(userRecord)) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_requested",
            outcome: "generic_success",
            reason: "ineligible_account",
          },
          "Forgot-password request completed with generic success",
        );

        return {
          requested: true,
        };
      }

      logger.info(
        {
          requestId,
          authEvent: "forgot_password_otp_requested",
          outcome: "eligible_user_identified",
          user: {
            userId: userRecord.id,
            role: userRecord.role,
          },
        },
        "Forgot-password request passed eligibility checks",
      );

      const currentTime = nowProvider();
      const latestActiveOtp = await repository.findLatestActiveOtpByUserId(userRecord.id, {
        currentTime,
        maxAttempts: AUTH_OTP_POLICY.MAX_ATTEMPTS,
      });

      if (latestActiveOtp) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_requested",
            outcome: "resend_blocked",
            reason: "active_otp_exists",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestActiveOtp.id,
              expiresAt: latestActiveOtp.expiresAt,
            },
          },
          "Forgot-password request blocked because an active OTP already exists",
        );

        throw createOtpResendTooSoonError();
      }

      const rawOtp = otpUtility.generateOtp();
      const otpCodeHash = await otpUtility.hashOtp(rawOtp);
      const expiresAt = otpUtility.calculateOtpExpiresAt({
        currentDate: currentTime,
        expiresInSeconds: otpUtility.OTP_EXPIRES_SECONDS,
      });

      await repository.invalidateOlderActiveOtps(userRecord.id, {
        currentTime,
        maxAttempts: AUTH_OTP_POLICY.MAX_ATTEMPTS,
        usedAt: currentTime,
      });

      const createdOtp = await repository.createPasswordResetOtp({
        userId: userRecord.id,
        otpCodeHash,
        expiresAt,
      });

      logger.info(
        {
          requestId,
          authEvent: "forgot_password_otp_requested",
          outcome: "otp_created",
          user: {
            userId: userRecord.id,
            role: userRecord.role,
          },
          otp: {
            otpId: createdOtp.id,
            expiresAt: createdOtp.expiresAt,
          },
        },
        "Forgot-password OTP created for eligible user",
      );

      try {
        await mailService.sendForgotPasswordOtp({
          toEmail: userRecord.email,
          otp: rawOtp,
          expiresInSeconds: AUTH_OTP_POLICY.EXPIRES_SECONDS,
          requestId,
          userId: userRecord.id,
        });
      } catch (error) {
        await repository.markOtpAsUsed(createdOtp.id, currentTime);

        logger.error(
          {
            requestId,
            authEvent: "forgot_password_otp_requested",
            outcome: "otp_delivery_failed",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: createdOtp.id,
            },
          },
          "Forgot-password OTP was invalidated after delivery failure",
        );

        throw createOtpDeliveryFailedError();
      }

      return {
        requested: true,
      };
    },

    async verifyForgotPasswordOtp(payload = {}) {
      const { email, otp, requestId } = payload;
      const userRecord = await repository.findUserByEmail(email);

      if (!isEligibleForgotPasswordUser(userRecord)) {
        throw createInvalidOtpError();
      }

      const latestOtpRecord = await repository.findLatestOtpForVerificationByUserId(userRecord.id);

      if (!latestOtpRecord) {
        throw createInvalidOtpError();
      }

      const currentTime = nowProvider();

      if (dateUtils.isExpired(latestOtpRecord.expiresAt, currentTime)) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_verification",
            outcome: "rejected",
            reason: "otp_expired",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Forgot-password OTP verification rejected because the latest OTP expired",
        );

        throw createOtpExpiredError();
      }

      if (latestOtpRecord.attemptCount >= AUTH_OTP_POLICY.MAX_ATTEMPTS) {
        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_verification",
            outcome: "rejected",
            reason: "attempt_limit_exceeded",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Forgot-password OTP verification rejected because the latest OTP reached the failed-attempt limit",
        );

        throw createOtpAttemptLimitExceededError();
      }

      const otpMatches = await otpUtility.verifyOtp(otp, latestOtpRecord.otpCodeHash);

      if (!otpMatches) {
        const updatedOtpRecord = await repository.incrementOtpAttemptCount(latestOtpRecord.id);

        logger.info(
          {
            requestId,
            authEvent: "forgot_password_otp_verification",
            outcome: "rejected",
            reason: "invalid_otp",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              attemptCount: updatedOtpRecord.attemptCount,
            },
          },
          "Forgot-password OTP verification rejected because the submitted OTP did not match",
        );

        throw createInvalidOtpError();
      }

      const verifiedOtpRecord = await repository.markOtpAsVerified(latestOtpRecord.id, currentTime);

      logger.info(
        {
          requestId,
          authEvent: "forgot_password_otp_verification",
          outcome: "verified",
          user: {
            userId: userRecord.id,
            role: userRecord.role,
          },
          otp: {
            otpId: verifiedOtpRecord.id,
            expiresAt: verifiedOtpRecord.expiresAt,
            verifiedAt: verifiedOtpRecord.verifiedAt,
            attemptCount: verifiedOtpRecord.attemptCount,
          },
        },
        "Forgot-password OTP verification completed successfully",
      );

      return {
        verified: true,
      };
    },

    async resetPassword(payload = {}) {
      const {
        email,
        otp,
        newPassword,
        confirmNewPassword,
        requestId,
      } = payload;
      const userRecord = await repository.findUserByEmail(email);

      if (!isEligibleForgotPasswordUser(userRecord)) {
        throw createInvalidOtpError();
      }

      const latestOtpRecord = await repository.findLatestOtpForVerificationByUserId(userRecord.id);

      if (!latestOtpRecord) {
        throw createInvalidOtpError();
      }

      const currentTime = nowProvider();

      if (dateUtils.isExpired(latestOtpRecord.expiresAt, currentTime)) {
        logger.info(
          {
            requestId,
            authEvent: "reset_password",
            outcome: "rejected",
            reason: "otp_expired",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              verifiedAt: latestOtpRecord.verifiedAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Reset-password request rejected because the latest OTP expired",
        );

        throw createOtpExpiredError();
      }

      if (latestOtpRecord.attemptCount >= AUTH_OTP_POLICY.MAX_ATTEMPTS) {
        logger.info(
          {
            requestId,
            authEvent: "reset_password",
            outcome: "rejected",
            reason: "attempt_limit_exceeded",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              verifiedAt: latestOtpRecord.verifiedAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Reset-password request rejected because the latest OTP reached the failed-attempt limit",
        );

        throw createOtpAttemptLimitExceededError();
      }

      if (!latestOtpRecord.verifiedAt) {
        logger.info(
          {
            requestId,
            authEvent: "reset_password",
            outcome: "rejected",
            reason: "otp_not_verified",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Reset-password request rejected because the latest OTP has not been verified",
        );

        throw createOtpNotVerifiedError();
      }

      const otpMatches = await otpUtility.verifyOtp(otp, latestOtpRecord.otpCodeHash);

      if (!otpMatches) {
        logger.info(
          {
            requestId,
            authEvent: "reset_password",
            outcome: "rejected",
            reason: "invalid_otp",
            user: {
              userId: userRecord.id,
              role: userRecord.role,
            },
            otp: {
              otpId: latestOtpRecord.id,
              expiresAt: latestOtpRecord.expiresAt,
              verifiedAt: latestOtpRecord.verifiedAt,
              attemptCount: latestOtpRecord.attemptCount,
            },
          },
          "Reset-password request rejected because the submitted OTP did not match",
        );

        throw createInvalidOtpError();
      }

      if (newPassword !== confirmNewPassword) {
        throw createPasswordMismatchError();
      }

      if (!passwordMeetsPolicy(newPassword)) {
        throw createPasswordPolicyError();
      }

      const nextPasswordHash = await passwordUtility.hashPassword(newPassword);

      await repository.updateUserPassword(userRecord.id, nextPasswordHash, {
        mustChangePassword: false,
      });
      await repository.markOtpAsUsed(latestOtpRecord.id, currentTime);

      logger.info(
        {
          requestId,
          authEvent: "reset_password",
          outcome: "password_reset_completed",
          user: {
            userId: userRecord.id,
            role: userRecord.role,
          },
          otp: {
            otpId: latestOtpRecord.id,
            verifiedAt: latestOtpRecord.verifiedAt,
            usedAt: currentTime,
          },
        },
        "Reset-password flow completed successfully",
      );
    },

    async createEmployeeUser(payload = {}) {
      const {
        employeeId,
        requestId,
        authenticatedUser,
      } = payload;

      const employeeRecord = await repository.findEmployeeById(employeeId);

      if (!employeeRecord) {
        logger.info(
          {
            requestId,
            authEvent: "admin_create_employee_user",
            outcome: "rejected",
            reason: "employee_not_found",
            actor: {
              userId: authenticatedUser?.userId,
              role: authenticatedUser?.role,
            },
            employee: {
              employeeId,
            },
          },
          "Admin create-user request rejected because the employee does not exist",
        );

        throw createEmployeeNotFoundError();
      }

      const [duplicateEmployeeAccount, duplicateEmailAccount] = await Promise.all([
        repository.hasUserForEmployee(employeeRecord.id),
        repository.hasUserWithEmail(employeeRecord.email),
      ]);

      if (duplicateEmployeeAccount || duplicateEmailAccount) {
        logger.info(
          {
            requestId,
            authEvent: "admin_create_employee_user",
            outcome: "rejected",
            reason: "user_already_exists",
            actor: {
              userId: authenticatedUser?.userId,
              role: authenticatedUser?.role,
            },
            employee: {
              employeeId: employeeRecord.id,
            },
            duplicateChecks: {
              employeeAccountExists: duplicateEmployeeAccount,
              emailAccountExists: duplicateEmailAccount,
            },
          },
          "Admin create-user request rejected because the employee already has a user account or email is already taken",
        );

        throw createUserAlreadyExistsError();
      }

      const passwordHash = await passwordUtility.hashPassword(defaultUserPassword);
      const createdUser = await repository.createUser({
        employeeId: employeeRecord.id,
        email: employeeRecord.email,
        passwordHash,
        role: ROLES.USER,
        isActive: true,
        mustChangePassword: true,
      });

      logger.info(
        {
          requestId,
          authEvent: "admin_create_employee_user",
          outcome: "created",
          actor: {
            userId: authenticatedUser?.userId,
            role: authenticatedUser?.role,
          },
          user: {
            userId: createdUser.id,
            employeeId: createdUser.employeeId,
            role: createdUser.role,
            isActive: createdUser.isActive,
            mustChangePassword: createdUser.mustChangePassword,
          },
        },
        "Admin create-user request completed successfully",
      );

      return mapUserToSafeAuthResponse(createdUser);
    },

    async updateUserStatus(payload = {}) {
      const {
        userId,
        isActive,
        requestId,
        authenticatedUser,
      } = payload;

      const existingUser = await repository.findUserById(userId);

      if (!existingUser) {
        logger.info(
          {
            requestId,
            authEvent: "admin_update_user_status",
            outcome: "rejected",
            reason: "user_not_found",
            actor: {
              userId: authenticatedUser?.userId,
              role: authenticatedUser?.role,
            },
            user: {
              userId,
            },
          },
          "Admin user-status update rejected because the target user does not exist",
        );

        throw createUserNotFoundError();
      }

      const updatedUser = await repository.updateUserStatus(userId, isActive);

      logger.info(
        {
          requestId,
          authEvent: "admin_update_user_status",
          outcome: "updated",
          actor: {
            userId: authenticatedUser?.userId,
            role: authenticatedUser?.role,
          },
          user: {
            userId: updatedUser.id,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
            mustChangePassword: updatedUser.mustChangePassword,
          },
          statusChange: {
            previousIsActive: existingUser.isActive,
            nextIsActive: updatedUser.isActive,
          },
        },
        "Admin user-status update completed successfully",
      );

      return mapUserToSafeAuthResponse(updatedUser);
    },
  });
}

const authService = createAuthService();

module.exports = Object.freeze({
  ...authService,
  createAuthService,
  createInvalidCredentialsError,
  createInactiveAccountError,
  createUnauthorizedError,
  createUserNotFoundError,
  createEmployeeNotFoundError,
  createEmployeeEmailMismatchError,
  createUserAlreadyExistsError,
  createPasswordMismatchError,
  createPasswordPolicyError,
  createOtpResendTooSoonError,
  createOtpDeliveryFailedError,
  createInvalidOtpError,
  createOtpExpiredError,
  createOtpAttemptLimitExceededError,
  createOtpNotVerifiedError,
  passwordMeetsPolicy,
  mapUserToSafeAuthResponse,
  mapLoginToSafeAuthResponse,
  isEligibleForgotPasswordUser,
});
