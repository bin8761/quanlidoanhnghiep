describe('validateRequest middleware', () => {
  function loadValidateRequest() {
    jest.resetModules();
    return require('../../../src/middlewares/validateRequest');
  }

  test('returns validation details with only path and message', async () => {
    const validateRequest = loadValidateRequest();
    const { z } = require('zod');
    const schema = {
      body: z.object({
        email: z.string().email('Invalid email'),
      }),
    };
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'invalid' },
    });
    const response = createMockResponse();
    const next = createNext();

    const middleware = validateRequest(schema);
    middleware(request, response, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeTruthy();
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual([
      {
        path: 'email',
        message: 'Invalid email',
      },
    ]);
  });

  test('passes validated data through when schema succeeds', async () => {
    const validateRequest = loadValidateRequest();
    const { z } = require('zod');
    const schema = {
      body: z.object({
        email: z.string().email(),
      }),
    };
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      body: { email: 'user@example.com' },
    });
    const response = createMockResponse();
    const next = createNext();

    const middleware = validateRequest(schema);
    middleware(request, response, next);

    expect(request.body).toEqual({ email: 'user@example.com' });
    expect(next).toHaveBeenCalledWith();
  });
});
