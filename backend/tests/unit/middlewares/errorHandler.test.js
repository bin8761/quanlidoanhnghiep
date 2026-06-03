describe('errorHandler middleware', () => {
  function loadErrorHandler() {
    jest.resetModules();
    return require('../../../src/middlewares/errorHandler');
  }

  test('returns standardized AppError envelope with requestId and details', () => {
    const errorHandler = loadErrorHandler();
    const AppError = require('../../../src/shared/errors/AppError');
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      requestId: 'req-error-1',
    });
    const response = createMockResponse();
    const next = createNext();
    const error = new AppError({
      message: 'Validation failed',
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      details: [{ path: 'body.email', message: 'Invalid email' }],
    });

    errorHandler(error, request, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      requestId: 'req-error-1',
      details: [{ path: 'body.email', message: 'Invalid email' }],
    });
  });

  test('returns internal server error envelope for unknown errors', () => {
    const errorHandler = loadErrorHandler();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      requestId: 'req-error-2',
    });
    const response = createMockResponse();
    const next = createNext();
    const error = new Error('Unexpected failure');

    errorHandler(error, request, response, next);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        errorCode: 'INTERNAL_SERVER_ERROR',
        requestId: 'req-error-2',
      }),
    );
  });
});
