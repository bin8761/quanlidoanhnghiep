describe('requestLogger middleware', () => {
  function loadRequestLogger(loggerOverrides = {}) {
    jest.resetModules();

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      ...loggerOverrides,
    };

    jest.doMock('../../../src/config/logger', () => logger);

    return {
      requestLogger: require('../../../src/middlewares/requestLogger'),
      logger,
    };
  }

  test('logs safe request metadata and calls next', () => {
    const { requestLogger, logger } = loadRequestLogger();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      id: 'req-log-1',
      method: 'POST',
      originalUrl: '/api/auth/login',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'jest-test',
      },
    });
    const response = createMockResponse();
    const next = createNext();

    requestLogger(request, response, next);
    response.statusCode = 200;
    response.__events.finish();

    expect(logger.info).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
