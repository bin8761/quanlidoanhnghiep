describe('password.util', () => {
  function loadPasswordUtil() {
    jest.resetModules();
    return require('../../../src/shared/utils/password.util');
  }

  test('hashPassword and comparePassword work together for a valid password', async () => {
    const passwordUtil = loadPasswordUtil();
    const rawPassword = 'Password123';

    const passwordHash = await passwordUtil.hashPassword(rawPassword);
    const matched = await passwordUtil.verifyPassword(rawPassword, passwordHash);

    expect(typeof passwordHash).toBe('string');
    expect(passwordHash.length).toBeGreaterThan(0);
    expect(matched).toBe(true);
  });

  test('verifyPassword returns false for a different password', async () => {
    const passwordUtil = loadPasswordUtil();
    const passwordHash = await passwordUtil.hashPassword('Password123');

    const matched = await passwordUtil.verifyPassword('WrongPassword123', passwordHash);

    expect(matched).toBe(false);
  });
});
