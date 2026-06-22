describe('authenticate middleware', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  function loadAuthenticate({
    verifyAccessTokenImpl = jest.fn(),
    findUserByIdImpl = jest.fn(),
  } = {}) {
    jest.resetModules();

    jest.doMock('../../../src/shared/utils/token.util', () => ({
      verifyAccessToken: verifyAccessTokenImpl,
    }));

    jest.doMock('../../../src/config/database', () => ({
      user: {
        findUnique: findUserByIdImpl,
      },
    }));

    return require('../../../src/middlewares/authenticate');
  }

  test('rejects when authorization header is missing', async () => {
    const authenticate = loadAuthenticate();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest();
    const response = createMockResponse();
    const next = createNext();

    await authenticate(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.errorCode).toBe('AUTH_UNAUTHORIZED');
  });

  test('attaches only safe user fields from decoded token and persisted user', async () => {
    const verifyAccessToken = jest.fn().mockReturnValue({
      userId: USER_ID,
      email: 'user@example.com',
      role: 'ADMIN',
      passwordHash: 'should-not-leak',
      profile: { internal: true },
    });
    const findUserById = jest.fn().mockResolvedValue({
      id: USER_ID,
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      employee: {
        status: 'ACTIVE',
      },
    });

    const authenticate = loadAuthenticate({
      verifyAccessTokenImpl: verifyAccessToken,
      findUserByIdImpl: findUserById,
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: { authorization: 'Bearer token-value' },
    });
    const response = createMockResponse();
    const next = createNext();

    await authenticate(request, response, next);

    expect(verifyAccessToken).toHaveBeenCalledWith('token-value');
    expect(findUserById).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employee: {
          select: {
            status: true,
          },
        },
      },
    });
    expect(request.user).toEqual({
      userId: USER_ID,
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects a token when the linked user account is inactive', async () => {
    const verifyAccessToken = jest.fn().mockReturnValue({
      userId: USER_ID,
      email: 'inactive@example.com',
      role: 'USER',
    });
    const findUserById = jest.fn().mockResolvedValue({
      id: USER_ID,
      email: 'inactive@example.com',
      role: 'USER',
      isActive: false,
      employee: {
        status: 'ACTIVE',
      },
    });

    const authenticate = loadAuthenticate({
      verifyAccessTokenImpl: verifyAccessToken,
      findUserByIdImpl: findUserById,
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: { authorization: 'Bearer token-value' },
    });
    const response = createMockResponse();
    const next = createNext();

    await authenticate(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe('AUTH_ACCOUNT_INACTIVE');
  });

  test('rejects a token when the linked employee is inactive', async () => {
    const verifyAccessToken = jest.fn().mockReturnValue({
      userId: USER_ID,
      email: 'employee@example.com',
      role: 'USER',
    });
    const findUserById = jest.fn().mockResolvedValue({
      id: USER_ID,
      email: 'employee@example.com',
      role: 'USER',
      isActive: true,
      employee: {
        status: 'INACTIVE',
      },
    });

    const authenticate = loadAuthenticate({
      verifyAccessTokenImpl: verifyAccessToken,
      findUserByIdImpl: findUserById,
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: { authorization: 'Bearer token-value' },
    });
    const response = createMockResponse();
    const next = createNext();

    await authenticate(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe('AUTH_ACCOUNT_INACTIVE');
  });
});
