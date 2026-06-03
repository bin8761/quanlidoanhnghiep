describe('otp.util', () => {
  function loadOtpUtil() {
    jest.resetModules();
    return require('../../../src/shared/utils/otp.util');
  }

  test('generateOtp returns a six-digit string', () => {
    const otpUtil = loadOtpUtil();

    const otp = otpUtil.generateOtp();

    expect(typeof otp).toBe('string');
    expect(otp).toMatch(/^\d{6}$/);
  });

  test('hashOtp and compareOtp work together for a valid OTP', async () => {
    const otpUtil = loadOtpUtil();
    const rawOtp = '123456';

    const otpHash = await otpUtil.hashOtp(rawOtp);
    const matched = await otpUtil.verifyOtp(rawOtp, otpHash);

    expect(typeof otpHash).toBe('string');
    expect(otpHash.length).toBeGreaterThan(0);
    expect(matched).toBe(true);
  });

  test('calculateOtpExpiresAt returns a date 60 seconds after the input time by default', () => {
    const otpUtil = loadOtpUtil();
    const currentDate = new Date('2026-06-03T00:00:00.000Z');

    const expiresAt = otpUtil.calculateOtpExpiresAt({ currentDate });

    expect(expiresAt.toISOString()).toBe('2026-06-03T00:01:00.000Z');
  });
});
