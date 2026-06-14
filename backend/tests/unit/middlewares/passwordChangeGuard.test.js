describe('passwordChangeGuard middleware', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  function loadPasswordChangeGuard({ findUserByIdImpl = jest.fn() } = {}) {
    jest.resetModules();

    jest.doMock('../../../src/config/database', () => ({
      user: {
        findUnique: findUserByIdImpl,
      },
    }));

    return require('../../../src/middlewares/passwordChangeGuard');
  }

  test('rejects when authenticated user is missing', async () => {
    const passwordChangeGuard = loadPasswordChangeGuard();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest();
    const response = createMockResponse();
    const next = createNext();

    await passwordChangeGuard(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.errorCode).toBe('AUTH_UNAUTHORIZED');
  });

  test('allows access and exposes state when user should change password', async () => {
    const findUserById = jest.fn().mockResolvedValue({
      id: USER_ID,
      mustChangePassword: true,
    });
    const passwordChangeGuard = loadPasswordChangeGuard({
      findUserByIdImpl: findUserById,
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: USER_ID, email: 'user@example.com', role: 'USER' },
      method: 'GET',
      baseUrl: '/api',
      path: '/assets',
      originalUrl: '/api/assets',
    });
    const response = createMockResponse();
    const next = createNext();

    await passwordChangeGuard(request, response, next);

    expect(findUserById).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { mustChangePassword: true },
    });
    expect(response.locals.authUserState).toEqual({ mustChangePassword: true });
    expect(next).toHaveBeenCalledWith();
  });

  test('allows access when user no longer needs password change', async () => {
    const findUserById = jest.fn().mockResolvedValue({
      id: USER_ID,
      mustChangePassword: false,
    });
    const passwordChangeGuard = loadPasswordChangeGuard({
      findUserByIdImpl: findUserById,
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: USER_ID, email: 'user@example.com', role: 'USER' },
      method: 'GET',
      baseUrl: '/api',
      path: '/assets',
      originalUrl: '/api/assets',
    });
    const response = createMockResponse();
    const next = createNext();

    await passwordChangeGuard(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
