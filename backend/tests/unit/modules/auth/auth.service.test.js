describe('auth.service', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const EMPLOYEE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const INACTIVE_USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const OTP_ID = 'eeeeeeee-eeee-4eee-8eee-000000000001';
  function loadAuthService({
    repositoryOverrides = {},
    passwordUtilOverrides = {},
    otpUtilOverrides = {},
    tokenUtilOverrides = {},
    mailOverrides = {},
    loggerOverrides = {},
    nowProvider = () => new Date('2026-06-03T00:00:00.000Z'),
  } = {}) {
    jest.resetModules();

    const repository = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      updateLastLoginAt: jest.fn(),
      updateUserPassword: jest.fn(),
      findLatestActiveOtpByUserId: jest.fn(),
      invalidateOlderActiveOtps: jest.fn(),
      createPasswordResetOtp: jest.fn(),
      findLatestOtpForVerificationByUserId: jest.fn(),
      incrementOtpAttemptCount: jest.fn(),
      markOtpAsVerified: jest.fn(),
      markOtpAsUsed: jest.fn(),
      findEmployeeByCode: jest.fn(),
      hasUserForEmployee: jest.fn(),
      hasUserWithEmail: jest.fn(),
      createUser: jest.fn(),
      ...repositoryOverrides,
    };

    const passwordUtility = {
      verifyPassword: jest.fn(),
      hashPassword: jest.fn(),
      ...passwordUtilOverrides,
    };

    const otpUtility = {
      OTP_EXPIRES_SECONDS: 60,
      generateOtp: jest.fn(),
      hashOtp: jest.fn(),
      verifyOtp: jest.fn(),
      calculateOtpExpiresAt: jest.fn(),
      ...otpUtilOverrides,
    };

    const tokenUtility = {
      signAccessToken: jest.fn(),
      ...tokenUtilOverrides,
    };

    const mailService = {
      sendForgotPasswordOtp: jest.fn(),
      ...mailOverrides,
    };

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      ...loggerOverrides,
    };

    jest.doMock('../../../../src/modules/auth/auth.repository', () => repository);
    jest.doMock('../../../../src/shared/utils/password.util', () => passwordUtility);
    jest.doMock('../../../../src/shared/utils/otp.util', () => otpUtility);
    jest.doMock('../../../../src/shared/utils/token.util', () => tokenUtility);
    jest.doMock('../../../../src/config/mail', () => mailService);
    jest.doMock('../../../../src/config/logger', () => logger);

    const authServiceModule = require('../../../../src/modules/auth/auth.service');
    const authService = authServiceModule.createAuthService({
      repository,
      passwordUtility,
      otpUtility,
      tokenUtility,
      mailService,
      nowProvider,
      defaultUserPassword: process.env.DEFAULT_USER_PASSWORD,
    });

    return {
      authService,
      repository,
      passwordUtility,
      otpUtility,
      tokenUtility,
      mailService,
      logger,
    };
  }

  test('register creates a linked active USER account', async () => {
    const createdUser = {
      id: USER_ID,
      employeeId: EMPLOYEE_ID,
      email: 'employee@example.com',
      role: 'USER',
      isActive: true,
      mustChangePassword: false,
      employee: null,
    };
    const { authService, repository, passwordUtility } = loadAuthService({
      repositoryOverrides: {
        findEmployeeByCode: jest.fn().mockResolvedValue({
          id: EMPLOYEE_ID,
          employeeCode: 'EMP001',
          email: 'employee@example.com',
        }),
        hasUserForEmployee: jest.fn().mockResolvedValue(false),
        hasUserWithEmail: jest.fn().mockResolvedValue(false),
        createUser: jest.fn().mockResolvedValue(createdUser),
      },
      passwordUtilOverrides: {
        hashPassword: jest.fn().mockResolvedValue('password-hash'),
      },
    });

    await expect(
      authService.register({
        employeeCode: 'EMP001',
        email: 'employee@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    ).resolves.toEqual(createdUser);
    expect(passwordUtility.hashPassword).toHaveBeenCalledWith('Password123');
    expect(repository.createUser).toHaveBeenCalledWith({
      employeeId: EMPLOYEE_ID,
      email: 'employee@example.com',
      passwordHash: 'password-hash',
      role: 'USER',
      isActive: true,
      mustChangePassword: false,
    });
  });

  test('register rejects an employee email mismatch', async () => {
    const { authService } = loadAuthService({
      repositoryOverrides: {
        findEmployeeByCode: jest.fn().mockResolvedValue({
          id: EMPLOYEE_ID,
          employeeCode: 'EMP001',
          email: 'employee@example.com',
        }),
      },
    });

    await expect(
      authService.register({
        employeeCode: 'EMP001',
        email: 'other@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'AUTH_EMPLOYEE_EMAIL_MISMATCH',
    });
  });

  test('login returns safe auth payload for a valid active user', async () => {
    const foundUser = {
      id: USER_ID,
      email: 'user@example.com',
      role: 'USER',
      isActive: true,
      passwordHash: 'hashed-password',
      mustChangePassword: false,
    };
    const updatedUser = {
      ...foundUser,
      lastLoginAt: new Date('2026-06-03T00:00:00.000Z'),
      employee: {
        id: EMPLOYEE_ID,
        employeeCode: 'EMP001',
        fullName: 'Nguyen Huu Dat',
        avatarUrl: '/uploads/avatar.webp',
      },
    };
    const { authService, repository, passwordUtility, tokenUtility } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue(foundUser),
        updateLastLoginAt: jest.fn().mockResolvedValue(updatedUser),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(true),
      },
      tokenUtilOverrides: {
        signAccessToken: jest.fn().mockReturnValue('signed-jwt-token'),
      },
    });

    const result = await authService.login('user@example.com', 'Password123');

    expect(repository.findUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(passwordUtility.verifyPassword).toHaveBeenCalledWith('Password123', 'hashed-password');
    expect(tokenUtility.signAccessToken).toHaveBeenCalledWith({
      userId: USER_ID,
      role: 'USER',
      email: 'user@example.com',
    });
    expect(repository.updateLastLoginAt).toHaveBeenCalledWith(USER_ID);
    expect(result).toEqual({
      accessToken: 'signed-jwt-token',
      user: {
        id: USER_ID,
        email: 'user@example.com',
        role: 'USER',
        employeeId: undefined,
        mustChangePassword: false,
        isActive: true,
        employee: {
          id: EMPLOYEE_ID,
          employeeCode: 'EMP001',
          fullName: 'Nguyen Huu Dat',
          avatarUrl: '/uploads/avatar.webp',
        },
      },
    });
  });

  test('login rejects when credentials are invalid', async () => {
    const { authService, passwordUtility } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
          passwordHash: 'hashed-password',
        }),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(false),
      },
    });

    await expect(authService.login('user@example.com', 'wrong-password')).rejects.toMatchObject({
      errorCode: 'AUTH_INVALID_CREDENTIALS',
    });
    expect(passwordUtility.verifyPassword).toHaveBeenCalledWith('wrong-password', 'hashed-password');
  });

  test('login rejects inactive account', async () => {
    const { authService, tokenUtility } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: INACTIVE_USER_ID,
          email: 'inactive@example.com',
          role: 'USER',
          isActive: false,
          passwordHash: 'hashed-password',
        }),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(true),
      },
    });

    await expect(authService.login('inactive@example.com', 'Password123')).rejects.toMatchObject({
      errorCode: 'AUTH_ACCOUNT_INACTIVE',
    });
    expect(tokenUtility.signAccessToken).not.toHaveBeenCalled();
  });

  test('login rejects when linked employee is inactive', async () => {
    const { authService, repository, tokenUtility } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
          passwordHash: 'hashed-password',
          employee: {
            id: EMPLOYEE_ID,
            status: 'INACTIVE',
          },
        }),
        updateLastLoginAt: jest.fn(),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(true),
      },
    });

    await expect(authService.login('user@example.com', 'Password123')).rejects.toMatchObject({
      errorCode: 'AUTH_ACCOUNT_INACTIVE',
    });
    expect(repository.updateLastLoginAt).not.toHaveBeenCalled();
    expect(tokenUtility.signAccessToken).not.toHaveBeenCalled();
  });

  test('changePassword rejects when current password does not match', async () => {
    const { authService, repository, passwordUtility } = loadAuthService({
      repositoryOverrides: {
        findUserById: jest.fn().mockResolvedValue({
          id: USER_ID,
          passwordHash: 'current-hash',
        }),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(false),
      },
    });

    await expect(
      authService.changePassword(
        { userId: USER_ID, email: 'user@example.com', role: 'USER' },
        {
          currentPassword: 'wrong-password',
          newPassword: 'NewPassword123',
          confirmNewPassword: 'NewPassword123',
        },
      ),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_PASSWORD_MISMATCH',
    });

    expect(repository.findUserById).toHaveBeenCalledWith(USER_ID);
    expect(passwordUtility.verifyPassword).toHaveBeenCalledWith('wrong-password', 'current-hash');
  });

  test('changePassword rejects when confirmation does not match', async () => {
    const { authService, repository } = loadAuthService();

    await expect(
      authService.changePassword(
        { userId: USER_ID, email: 'user@example.com', role: 'USER' },
        {
          currentPassword: 'Password123',
          newPassword: 'NewPassword123',
          confirmNewPassword: 'Mismatch123',
        },
      ),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_PASSWORD_MISMATCH',
    });

    expect(repository.findUserById).not.toHaveBeenCalled();
  });

  test('changePassword updates password and clears mustChangePassword on success', async () => {
    const { authService, repository, passwordUtility } = loadAuthService({
      repositoryOverrides: {
        findUserById: jest.fn().mockResolvedValue({
          id: USER_ID,
          passwordHash: 'current-hash',
        }),
        updateUserPassword: jest.fn().mockResolvedValue(undefined),
      },
      passwordUtilOverrides: {
        verifyPassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn().mockResolvedValue('new-password-hash'),
      },
    });

    await authService.changePassword(
      { userId: USER_ID, email: 'user@example.com', role: 'USER' },
      {
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'NewPassword123',
      },
    );

    expect(passwordUtility.hashPassword).toHaveBeenCalledWith('NewPassword123');
    expect(repository.updateUserPassword).toHaveBeenCalledWith(USER_ID, 'new-password-hash', {
      mustChangePassword: false,
    });
  });

  test('requestForgotPasswordOtp returns generic safe success for unknown email', async () => {
    const { authService, repository } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue(null),
      },
    });

    const result = await authService.requestForgotPasswordOtp({
      email: 'unknown@example.com',
      requestId: 'req-1',
    });

    expect(repository.findUserByEmail).toHaveBeenCalledWith('unknown@example.com');
    expect(result).toEqual({ requested: true });
  });

  test('requestForgotPasswordOtp returns generic safe success for admin user', async () => {
    const { authService } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
        }),
      },
    });

    await expect(
      authService.requestForgotPasswordOtp({
        email: 'admin@example.com',
        requestId: 'req-admin-forgot-1',
      }),
    ).resolves.toEqual({ requested: true });
  });

  test('requestForgotPasswordOtp creates and sends otp for eligible user', async () => {
    const currentTime = new Date('2026-06-03T00:00:00.000Z');
    const expiresAt = new Date('2026-06-03T00:01:00.000Z');
    const { authService, repository, otpUtility, mailService } = loadAuthService({
      nowProvider: () => currentTime,
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestActiveOtpByUserId: jest.fn().mockResolvedValue(null),
        invalidateOlderActiveOtps: jest.fn().mockResolvedValue(0),
        createPasswordResetOtp: jest.fn().mockResolvedValue({
          id: OTP_ID,
          expiresAt,
        }),
      },
      otpUtilOverrides: {
        generateOtp: jest.fn().mockReturnValue('123456'),
        hashOtp: jest.fn().mockResolvedValue('hashed-otp'),
        calculateOtpExpiresAt: jest.fn().mockReturnValue(expiresAt),
      },
    });

    const result = await authService.requestForgotPasswordOtp({
      email: 'user@example.com',
      requestId: 'req-forgot-eligible-1',
    });

    expect(otpUtility.generateOtp).toHaveBeenCalled();
    expect(repository.createPasswordResetOtp).toHaveBeenCalledWith({
      userId: USER_ID,
      otpCodeHash: 'hashed-otp',
      expiresAt,
    });
    expect(mailService.sendForgotPasswordOtp).toHaveBeenCalledWith({
      toEmail: 'user@example.com',
      otp: '123456',
      expiresInSeconds: 60,
      requestId: 'req-forgot-eligible-1',
      userId: USER_ID,
    });
    expect(result).toEqual({ requested: true });
  });

  test('requestForgotPasswordOtp rejects resend-too-soon when active otp exists', async () => {
    const { authService } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestActiveOtpByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
        }),
      },
    });

    await expect(
      authService.requestForgotPasswordOtp({
        email: 'user@example.com',
        requestId: 'req-forgot-resend-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_OTP_RESEND_TOO_SOON',
    });
  });

  test('verifyForgotPasswordOtp returns verified true for a valid otp', async () => {
    const currentTime = new Date('2026-06-03T00:00:30.000Z');
    const { authService, repository, otpUtility } = loadAuthService({
      nowProvider: () => currentTime,
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
        }),
        markOtpAsVerified: jest.fn().mockResolvedValue({
          id: OTP_ID,
          verifiedAt: currentTime,
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
        }),
      },
      otpUtilOverrides: {
        verifyOtp: jest.fn().mockResolvedValue(true),
      },
    });

    const result = await authService.verifyForgotPasswordOtp({
      email: 'user@example.com',
      otp: '123456',
      requestId: 'req-verify-otp-1',
    });

    expect(otpUtility.verifyOtp).toHaveBeenCalledWith('123456', 'hashed-otp');
    expect(repository.markOtpAsVerified).toHaveBeenCalledWith(OTP_ID, currentTime);
    expect(result).toEqual({ verified: true });
  });

  test('verifyForgotPasswordOtp increments attempts for invalid otp', async () => {
    const { authService, repository, otpUtility } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
        }),
        incrementOtpAttemptCount: jest.fn().mockResolvedValue({
          id: OTP_ID,
          attemptCount: 1,
        }),
      },
      otpUtilOverrides: {
        verifyOtp: jest.fn().mockResolvedValue(false),
      },
    });

    await expect(
      authService.verifyForgotPasswordOtp({
        email: 'user@example.com',
        otp: '123456',
        requestId: 'req-verify-otp-invalid-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_INVALID_OTP',
    });
    expect(repository.incrementOtpAttemptCount).toHaveBeenCalledWith(OTP_ID);
    expect(otpUtility.verifyOtp).toHaveBeenCalledWith('123456', 'hashed-otp');
  });

  test('verifyForgotPasswordOtp rejects expired otp', async () => {
    const { authService } = loadAuthService({
      nowProvider: () => new Date('2026-06-03T00:02:00.000Z'),
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
        }),
      },
    });

    await expect(
      authService.verifyForgotPasswordOtp({
        email: 'user@example.com',
        otp: '123456',
        requestId: 'req-verify-otp-expired-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_OTP_EXPIRED',
    });
  });

  test('verifyForgotPasswordOtp rejects after 3 failed attempts', async () => {
    const { authService } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 3,
        }),
      },
    });

    await expect(
      authService.verifyForgotPasswordOtp({
        email: 'user@example.com',
        otp: '123456',
        requestId: 'req-verify-otp-limit-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED',
    });
  });

  test('resetPassword requires a verified otp', async () => {
    const { authService, repository } = loadAuthService({
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
          verifiedAt: null,
        }),
      },
    });

    await expect(
      authService.resetPassword({
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'Password123',
        confirmNewPassword: 'Password123',
        requestId: 'req-reset-unverified-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_OTP_NOT_VERIFIED',
    });
    expect(repository.updateUserPassword).not.toHaveBeenCalled();
  });

  test('resetPassword rejects expired otp', async () => {
    const { authService } = loadAuthService({
      nowProvider: () => new Date('2026-06-03T00:02:00.000Z'),
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
          verifiedAt: new Date('2026-06-03T00:00:30.000Z'),
        }),
      },
    });

    await expect(
      authService.resetPassword({
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'Password123',
        confirmNewPassword: 'Password123',
        requestId: 'req-reset-expired-1',
      }),
    ).rejects.toMatchObject({
      errorCode: 'AUTH_OTP_EXPIRED',
    });
  });

  test('resetPassword updates password and marks otp used on success', async () => {
    const currentTime = new Date('2026-06-03T00:00:30.000Z');
    const { authService, repository, otpUtility, passwordUtility } = loadAuthService({
      nowProvider: () => currentTime,
      repositoryOverrides: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'user@example.com',
          role: 'USER',
          isActive: true,
        }),
        findLatestOtpForVerificationByUserId: jest.fn().mockResolvedValue({
          id: OTP_ID,
          otpCodeHash: 'hashed-otp',
          expiresAt: new Date('2026-06-03T00:01:00.000Z'),
          attemptCount: 0,
          verifiedAt: currentTime,
        }),
        updateUserPassword: jest.fn().mockResolvedValue(undefined),
        markOtpAsUsed: jest.fn().mockResolvedValue(undefined),
      },
      otpUtilOverrides: {
        verifyOtp: jest.fn().mockResolvedValue(true),
      },
      passwordUtilOverrides: {
        hashPassword: jest.fn().mockResolvedValue('new-password-hash'),
      },
    });

    await authService.resetPassword({
      email: 'user@example.com',
      otp: '123456',
      newPassword: 'Password123',
      confirmNewPassword: 'Password123',
      requestId: 'req-reset-success-1',
    });

    expect(otpUtility.verifyOtp).toHaveBeenCalledWith('123456', 'hashed-otp');
    expect(passwordUtility.hashPassword).toHaveBeenCalledWith('Password123');
    expect(repository.updateUserPassword).toHaveBeenCalledWith(USER_ID, 'new-password-hash', {
      mustChangePassword: false,
    });
    expect(repository.markOtpAsUsed).toHaveBeenCalledWith(OTP_ID, currentTime);
  });
});
