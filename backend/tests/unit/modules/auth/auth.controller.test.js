describe('auth.controller', () => {
  function loadAuthController(serviceOverrides = {}) {
    jest.resetModules();

    const mockedService = {
      register: jest.fn(),
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      requestForgotPasswordOtp: jest.fn(),
      verifyForgotPasswordOtp: jest.fn(),
      resetPassword: jest.fn(),
      createEmployeeUser: jest.fn(),
      updateUserStatus: jest.fn(),
      ...serviceOverrides,
    };

    jest.doMock('../../../../src/modules/auth/auth.service', () => mockedService);

    return {
      authController: require('../../../../src/modules/auth/auth.controller'),
      mockedService,
    };
  }

  test('register delegates payload and returns created user', async () => {
    const registeredUser = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      employeeId: 'employee-1',
      isActive: true,
      mustChangePassword: false,
    };
    const { authController, mockedService } = loadAuthController({
      register: jest.fn().mockResolvedValue(registeredUser),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');
    const request = createMockRequest({
      body: {
        employeeCode: 'EMP001',
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.register(request, response, next);

    expect(mockedService.register).toHaveBeenCalledWith(request.body);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: registeredUser,
      }),
    );
  });

  test('forgotPassword delegates to service and returns standard envelope', async () => {
    const { authController, mockedService } = loadAuthController({
      requestForgotPasswordOtp: jest.fn().mockResolvedValue({ requested: true }),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'user@example.com' },
      requestId: 'req-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.forgotPassword(request, response, next);

    expect(mockedService.requestForgotPasswordOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      requestId: 'req-1',
    });
    expect(response.status).toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: {},
      }),
    );
  });

  test('login delegates credentials and returns standard success envelope', async () => {
    const loginResult = {
      accessToken: 'jwt-token',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        isActive: true,
        mustChangePassword: false,
      },
    };
    const { authController, mockedService } = loadAuthController({
      login: jest.fn().mockResolvedValue(loginResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'user@example.com', password: 'Password123' },
      requestId: 'req-login-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.login(request, response, next);

    expect(mockedService.login).toHaveBeenCalledWith('user@example.com', 'Password123');
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: loginResult,
      }),
    );
  });

  test('me delegates authenticated user and returns standard success envelope', async () => {
    const meResult = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      isActive: true,
      mustChangePassword: false,
    };
    const { authController, mockedService } = loadAuthController({
      getCurrentUser: jest.fn().mockResolvedValue(meResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: 'user-1', email: 'user@example.com', role: 'USER' },
      requestId: 'req-me-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.me(request, response, next);

    expect(mockedService.getCurrentUser).toHaveBeenCalledWith(request.user);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: meResult,
      }),
    );
  });

  test('logout delegates authenticated user and returns standard success envelope', async () => {
    const logoutResult = { loggedOut: true };
    const { authController, mockedService } = loadAuthController({
      logout: jest.fn().mockResolvedValue(logoutResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: 'user-1', email: 'user@example.com', role: 'USER' },
      requestId: 'req-logout-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.logout(request, response, next);

    expect(mockedService.logout).toHaveBeenCalledWith(request.user, {
      requestId: 'req-logout-1',
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: {},
      }),
    );
  });

  test('changePassword delegates payload and authenticated user', async () => {
    const changePasswordResult = { changed: true };
    const { authController, mockedService } = loadAuthController({
      changePassword: jest.fn().mockResolvedValue(changePasswordResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: {
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'NewPassword123',
      },
      user: { userId: 'user-1', email: 'user@example.com', role: 'USER' },
      requestId: 'req-change-password-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.changePassword(request, response, next);

    expect(mockedService.changePassword).toHaveBeenCalledWith(request.user, {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmNewPassword: 'NewPassword123',
      requestId: 'req-change-password-1',
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: {},
      }),
    );
  });

  test('login forwards service errors to next', async () => {
    const serviceError = new Error('Invalid credentials');
    const { authController, mockedService } = loadAuthController({
      login: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'user@example.com', password: 'wrong-password' },
      requestId: 'req-login-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.login(request, response, next);

    expect(mockedService.login).toHaveBeenCalledWith('user@example.com', 'wrong-password');
    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test('changePassword forwards service errors to next', async () => {
    const serviceError = new Error('Current password is incorrect');
    const { authController } = loadAuthController({
      changePassword: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: {
        currentPassword: 'wrong',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'NewPassword123',
      },
      user: { userId: 'user-1', email: 'user@example.com', role: 'USER' },
      requestId: 'req-change-password-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.changePassword(request, response, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test('createUser delegates validated payload and authenticated actor', async () => {
    const serviceResult = {
      id: 'user-2',
      email: 'employee@example.com',
      role: 'USER',
      isActive: true,
      mustChangePassword: true,
    };
    const { authController, mockedService } = loadAuthController({
      createEmployeeUser: jest.fn().mockResolvedValue(serviceResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { employeeId: 'employee-1' },
      user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      requestId: 'req-2',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.createUser(request, response, next);

    expect(mockedService.createEmployeeUser).toHaveBeenCalledWith({
      employeeId: 'employee-1',
      requestId: 'req-2',
      authenticatedUser: request.user,
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: serviceResult,
      }),
    );
  });

  test('updateUserStatus delegates id and isActive', async () => {
    const serviceResult = {
      id: 'user-3',
      email: 'user3@example.com',
      role: 'USER',
      isActive: false,
      mustChangePassword: false,
    };
    const { authController, mockedService } = loadAuthController({
      updateUserStatus: jest.fn().mockResolvedValue(serviceResult),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      params: { id: 'user-3' },
      body: { isActive: false },
      user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      requestId: 'req-3',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.updateUserStatus(request, response, next);

    expect(mockedService.updateUserStatus).toHaveBeenCalledWith({
      userId: 'user-3',
      isActive: false,
      requestId: 'req-3',
      authenticatedUser: request.user,
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: serviceResult,
      }),
    );
  });

  test('forgotPassword forwards service errors to next', async () => {
    const serviceError = new Error('Mail delivery failed');
    const { authController } = loadAuthController({
      requestForgotPasswordOtp: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'user@example.com' },
      requestId: 'req-forgot-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.forgotPassword(request, response, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test('resetPassword forwards service errors to next', async () => {
    const serviceError = new Error('OTP expired');
    const { authController } = loadAuthController({
      resetPassword: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: {
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'Password123',
        confirmNewPassword: 'Password123',
      },
      requestId: 'req-reset-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.resetPassword(request, response, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test('createUser forwards service errors to next', async () => {
    const serviceError = new Error('Employee not found');
    const { authController } = loadAuthController({
      createEmployeeUser: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      body: { employeeId: 'missing-employee' },
      user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      requestId: 'req-create-user-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.createUser(request, response, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test('updateUserStatus forwards service errors to next', async () => {
    const serviceError = new Error('User not found');
    const { authController } = loadAuthController({
      updateUserStatus: jest.fn().mockRejectedValue(serviceError),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../../helpers/mockExpress');

    const request = createMockRequest({
      params: { id: 'missing-user' },
      body: { isActive: false },
      user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      requestId: 'req-update-status-err-1',
    });
    const response = createMockResponse();
    const next = createNext();

    await authController.updateUserStatus(request, response, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
