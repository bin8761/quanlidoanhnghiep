describe('authenticate middleware', () => {
  function loadAuthenticate({ verifyAccessTokenImpl = jest.fn() } = {}) {
    jest.resetModules();

    jest.doMock('../../../src/shared/utils/token.util', () => ({
      verifyAccessToken: verifyAccessTokenImpl,
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
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'user@example.com',
      role: 'ADMIN',
      passwordHash: 'should-not-leak',
      profile: { internal: true },
    });

    const authenticate = loadAuthenticate({ verifyAccessTokenImpl: verifyAccessToken });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: { authorization: 'Bearer token-value' },
    });
    const response = createMockResponse();
    const next = createNext();

    await authenticate(request, response, next);

    expect(verifyAccessToken).toHaveBeenCalledWith('token-value');
    expect(request.user).toEqual({
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'user@example.com',
      role: 'ADMIN',
    });
    expect(next).toHaveBeenCalledWith();
  });
});
