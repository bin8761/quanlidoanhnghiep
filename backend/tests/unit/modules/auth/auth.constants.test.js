describe('auth.constants', () => {
  function loadAuthConstants() {
    jest.resetModules();
    return require('../../../../src/modules/auth/auth.constants');
  }

  test('exports stable auth response messages used by controllers', () => {
    const authConstants = loadAuthConstants();

    expect(authConstants).toEqual(
      expect.objectContaining({
        AUTH_RESPONSE_MESSAGES: expect.objectContaining({
          LOGIN_SUCCESS: expect.any(String),
          CURRENT_USER_SUCCESS: expect.any(String),
          LOGOUT_SUCCESS: expect.any(String),
          PASSWORD_CHANGED_SUCCESS: expect.any(String),
          FORGOT_PASSWORD_OTP_SENT: expect.any(String),
          OTP_VERIFIED_SUCCESS: expect.any(String),
          PASSWORD_RESET_SUCCESS: expect.any(String),
          USER_CREATED_SUCCESS: expect.any(String),
          USER_STATUS_UPDATED_SUCCESS: expect.any(String),
        }),
      }),
    );
  });
});
