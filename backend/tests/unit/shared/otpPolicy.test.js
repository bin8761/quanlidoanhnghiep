describe('shared otpPolicy constants', () => {
  function loadOtpPolicy() {
    jest.resetModules();
    return require('../../../src/shared/constants/otpPolicy');
  }

  test('exports stable OTP expiry and attempt policy values', () => {
    const OTP_POLICY = loadOtpPolicy();

    expect(OTP_POLICY).toEqual(
      expect.objectContaining({
        OTP_EXPIRES_SECONDS_DEFAULT: expect.any(Number),
        OTP_MAX_ATTEMPTS_DEFAULT: expect.any(Number),
        OTP_LENGTH: expect.any(Number),
      }),
    );
  });
});
