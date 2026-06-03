describe('authorize middleware', () => {
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  function loadAuthorize() {
    jest.resetModules();
    return require('../../../src/middlewares/authorize');
  }

  test('rejects when request user is missing', async () => {
    const authorize = loadAuthorize();
    const middleware = authorize('ADMIN');
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest();
    const response = createMockResponse();
    const next = createNext();

    await middleware(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.errorCode).toBe('AUTH_UNAUTHORIZED');
  });

  test('rejects when role is not allowed', async () => {
    const authorize = loadAuthorize();
    const middleware = authorize('ADMIN');
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: USER_ID, email: 'user@example.com', role: 'USER' },
    });
    const response = createMockResponse();
    const next = createNext();

    await middleware(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.errorCode).toBe('AUTH_FORBIDDEN');
  });

  test('passes when role is allowed', async () => {
    const authorize = loadAuthorize();
    const middleware = authorize('ADMIN', 'USER');
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      user: { userId: USER_ID, email: 'user@example.com', role: 'ADMIN' },
    });
    const response = createMockResponse();
    const next = createNext();

    await middleware(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
