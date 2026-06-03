describe('shared error codes', () => {
  function loadErrorCodes() {
    jest.resetModules();
    return require('../../../src/shared/errors/errorCodes');
  }

  test('contains required auth and system error code keys', () => {
    const ERROR_CODES = loadErrorCodes();

    expect(ERROR_CODES).toEqual(
      expect.objectContaining({
        INTERNAL_SERVER_ERROR: expect.any(String),
        VALIDATION_ERROR: expect.any(String),
        RATE_LIMIT_EXCEEDED: expect.any(String),
        AUTH_UNAUTHORIZED: expect.any(String),
        AUTH_FORBIDDEN: expect.any(String),
        AUTH_INVALID_CREDENTIALS: expect.any(String),
        AUTH_ACCOUNT_INACTIVE: expect.any(String),
        AUTH_PASSWORD_CHANGE_REQUIRED: expect.any(String),
        AUTH_INVALID_OTP: expect.any(String),
        AUTH_OTP_EXPIRED: expect.any(String),
        AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED: expect.any(String),
        AUTH_OTP_NOT_VERIFIED: expect.any(String),
        AUTH_USER_NOT_FOUND: expect.any(String),
      }),
    );
  });

  test('does not duplicate error code values for checked auth/system entries', () => {
    const ERROR_CODES = loadErrorCodes();
    const checkedKeys = [
      'INTERNAL_SERVER_ERROR',
      'VALIDATION_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'AUTH_UNAUTHORIZED',
      'AUTH_FORBIDDEN',
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_ACCOUNT_INACTIVE',
      'AUTH_PASSWORD_CHANGE_REQUIRED',
      'AUTH_INVALID_OTP',
      'AUTH_OTP_EXPIRED',
      'AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED',
      'AUTH_OTP_NOT_VERIFIED',
      'AUTH_USER_NOT_FOUND',
    ];
    const checkedValues = checkedKeys.map((key) => ERROR_CODES[key]);
    const uniqueValues = new Set(checkedValues);

    expect(uniqueValues.size).toBe(checkedValues.length);
  });
});
