describe('auth.validator', () => {
  function loadAuthValidators() {
    jest.resetModules();
    return require('../../../../src/modules/auth/auth.validator');
  }

  test('login validator accepts valid payload', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.login.body.parseAsync({
        email: 'user@example.com',
        password: 'Password123',
      }),
    ).resolves.toEqual({
      email: 'user@example.com',
      password: 'Password123',
    });
  });

  test('changePassword validator rejects missing confirm password', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.changePassword.body.parseAsync({
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
      }),
    ).rejects.toBeTruthy();
  });

  test('forgotPassword validator accepts valid email payload', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.forgotPassword.body.parseAsync({
        email: 'user@example.com',
      }),
    ).resolves.toEqual({
      email: 'user@example.com',
    });
  });

  test('verifyForgotPasswordOtp validator rejects short otp', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.verifyForgotPasswordOtp.body.parseAsync({
        email: 'user@example.com',
        otp: '123',
      }),
    ).rejects.toBeTruthy();
  });

  test('resetPassword validator accepts matching password confirmation payload', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.resetPassword.body.parseAsync({
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'Password123',
        confirmNewPassword: 'Password123',
      }),
    ).resolves.toEqual({
      email: 'user@example.com',
      otp: '123456',
      newPassword: 'Password123',
      confirmNewPassword: 'Password123',
    });
  });

  test('createUser validator rejects missing employeeId', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.createUser.body.parseAsync({}),
    ).rejects.toBeTruthy();
  });

  test('updateUserStatus validator accepts route id and boolean isActive', async () => {
    const validators = loadAuthValidators();

    await expect(
      validators.updateUserStatus.params.parseAsync({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    ).resolves.toEqual({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    await expect(
      validators.updateUserStatus.body.parseAsync({
        isActive: false,
      }),
    ).resolves.toEqual({
      isActive: false,
    });
  });
});
