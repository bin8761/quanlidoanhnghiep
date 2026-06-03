describe('tokenBucketRateLimit middleware', () => {
  function loadRateLimit(envOverrides = {}) {
    jest.resetModules();

    const originalEnv = { ...process.env };
    Object.assign(process.env, envOverrides);

    const module = require('../../../src/middlewares/tokenBucketRateLimit');
    const middleware = module.createTokenBucketRateLimit();

    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);

    return middleware;
  }

  test('allows requests while tokens are available', () => {
    const rateLimit = loadRateLimit({
      RATE_LIMIT_BUCKET_CAPACITY: '2',
      RATE_LIMIT_REFILL_TOKENS_PER_SECOND: '1',
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      ip: '127.0.0.1',
      path: '/api/auth/login',
      originalUrl: '/api/auth/login',
    });
    const response = createMockResponse();
    const next = createNext();

    rateLimit(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('returns standard rate-limit error envelope when bucket is exhausted', () => {
    const rateLimit = loadRateLimit({
      RATE_LIMIT_BUCKET_CAPACITY: '1',
      RATE_LIMIT_REFILL_TOKENS_PER_SECOND: '1',
      RATE_LIMIT_TOKENS_PER_REQUEST: '1',
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      ip: '127.0.0.2',
      path: '/api/auth/login',
      originalUrl: '/api/auth/login',
    });
    const response = createMockResponse();
    const next = createNext();

    rateLimit(request, response, next);
    rateLimit(request, response, next);

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
      }),
    );
  });

  test('consumes tokens and refills them over time', () => {
    jest.resetModules();
    const tokenBucketModule = require('../../../src/middlewares/tokenBucketRateLimit');
    const nowValues = [0, 0, 500, 1000];
    const rateLimit = tokenBucketModule.createTokenBucketRateLimit({
      capacity: 2,
      refillTokensPerSecond: 1,
      tokensPerRequest: 1,
      bucketStore: new Map(),
      nowProvider: jest.fn(() => nowValues.shift()),
    });
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      ip: '127.0.0.3',
      path: '/api/auth/login',
      originalUrl: '/api/auth/login',
    });

    const firstResponse = createMockResponse();
    const firstNext = createNext();
    rateLimit(request, firstResponse, firstNext);
    expect(firstNext).toHaveBeenCalledWith();
    expect(request.rateLimit.remainingTokens).toBe(1);

    const secondResponse = createMockResponse();
    const secondNext = createNext();
    rateLimit(request, secondResponse, secondNext);
    expect(secondNext).toHaveBeenCalledWith();
    expect(request.rateLimit.remainingTokens).toBe(0);

    const thirdResponse = createMockResponse();
    const thirdNext = createNext();
    rateLimit(request, thirdResponse, thirdNext);
    expect(thirdResponse.status).toHaveBeenCalledWith(429);

    const fourthResponse = createMockResponse();
    const fourthNext = createNext();
    rateLimit(request, fourthResponse, fourthNext);
    expect(fourthNext).toHaveBeenCalledWith();
    expect(request.rateLimit.remainingTokens).toBe(0);
  });
});
