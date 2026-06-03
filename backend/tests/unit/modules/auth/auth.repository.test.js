describe('auth.repository', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const USER_ID_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const EMPLOYEE_ID = '11111111-1111-4111-8111-111111111111';
  const OTP_ID = 'eeeeeeee-eeee-4eee-8eee-000000000001';

  function loadAuthRepository() {
    jest.resetModules();

    const prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
      },
      passwordResetOtp: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jest.doMock('../../../../src/config/database', () => prisma);

    return {
      repository: require('../../../../src/modules/auth/auth.repository'),
      prisma,
    };
  }

  test('findUserByEmail queries the user model and returns the persisted user', async () => {
    const persistedUser = { id: USER_ID, email: 'user@example.com', role: 'USER', isActive: true };
    const { repository, prisma } = loadAuthRepository();
    prisma.user.findUnique.mockResolvedValue(persistedUser);

    const result = await repository.findUserByEmail('user@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'user@example.com' },
      }),
    );
    expect(result).toEqual(expect.objectContaining(persistedUser));
  });

  test('findEmployeeById queries the employee model', async () => {
    const employee = { id: EMPLOYEE_ID, email: 'employee@example.com' };
    const { repository, prisma } = loadAuthRepository();
    prisma.employee.findUnique.mockResolvedValue(employee);

    const result = await repository.findEmployeeById(EMPLOYEE_ID);

    expect(prisma.employee.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: EMPLOYEE_ID },
      }),
    );
    expect(result).toEqual(expect.objectContaining(employee));
  });

  test('createPasswordResetOtp persists otp payload', async () => {
    const createdOtp = { id: OTP_ID, userId: USER_ID, otpCodeHash: 'hashed-otp' };
    const { repository, prisma } = loadAuthRepository();
    prisma.passwordResetOtp.create.mockResolvedValue(createdOtp);

    const result = await repository.createPasswordResetOtp({
      userId: USER_ID,
      otpCodeHash: 'hashed-otp',
      expiresAt: new Date('2026-06-03T00:01:00.000Z'),
    });

    expect(prisma.passwordResetOtp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          otpCodeHash: 'hashed-otp',
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining(createdOtp));
  });

  test('findLatestOtpForVerificationByUserId fetches the latest unused otp record', async () => {
    const otpRecord = { id: OTP_ID, userId: USER_ID, usedAt: null };
    const { repository, prisma } = loadAuthRepository();
    prisma.passwordResetOtp.findFirst.mockResolvedValue(otpRecord);

    const result = await repository.findLatestOtpForVerificationByUserId(USER_ID);

    expect(prisma.passwordResetOtp.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, usedAt: null }),
        orderBy: expect.any(Array),
      }),
    );
    expect(result).toEqual(expect.objectContaining(otpRecord));
  });

  test('updateUserPassword persists password hash and mustChangePassword state', async () => {
    const updatedUser = { id: USER_ID, mustChangePassword: false };
    const { repository, prisma } = loadAuthRepository();
    prisma.user.update.mockResolvedValue(updatedUser);

    const result = await repository.updateUserPassword(USER_ID, 'hashed-password', {
      mustChangePassword: false,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: {
          passwordHash: 'hashed-password',
          mustChangePassword: false,
        },
      }),
    );
    expect(result).toEqual(expect.objectContaining(updatedUser));
  });

  test('markOtpAsUsed updates usedAt for the targeted otp record', async () => {
    const updatedOtp = { id: OTP_ID, usedAt: new Date('2026-06-03T00:00:30.000Z') };
    const { repository, prisma } = loadAuthRepository();
    prisma.passwordResetOtp.update.mockResolvedValue(updatedOtp);

    const usedAt = new Date('2026-06-03T00:00:30.000Z');
    const result = await repository.markOtpAsUsed(OTP_ID, usedAt);

    expect(prisma.passwordResetOtp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: OTP_ID },
        data: { usedAt },
      }),
    );
    expect(result).toEqual(expect.objectContaining(updatedOtp));
  });

  test('updateUserStatus persists only the requested isActive state', async () => {
    const updatedUser = { id: USER_ID_2, isActive: false };
    const { repository, prisma } = loadAuthRepository();
    prisma.user.update.mockResolvedValue(updatedUser);

    const result = await repository.updateUserStatus(USER_ID_2, false);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID_2 },
        data: { isActive: false },
      }),
    );
    expect(result).toEqual(expect.objectContaining(updatedUser));
  });
});
