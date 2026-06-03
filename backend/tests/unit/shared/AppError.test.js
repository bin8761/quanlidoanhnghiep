describe('AppError', () => {
  function loadAppError() {
    jest.resetModules();
    return require('../../../src/shared/errors/AppError');
  }

  test('stores provided statusCode, errorCode, and details', () => {
    const AppError = loadAppError();

    const error = new AppError({
      message: 'Validation failed',
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      details: [{ path: 'body.email', message: 'Invalid email' }],
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual([{ path: 'body.email', message: 'Invalid email' }]);
  });

  test('defaults to internal server error fields when omitted', () => {
    const AppError = loadAppError();

    const error = new AppError({
      message: 'Unexpected error',
    });

    expect(error.message).toBe('Unexpected error');
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe('INTERNAL_SERVER_ERROR');
    expect(error.details).toBeUndefined();
  });
});
