describe('token.util', () => {
  function loadTokenUtil() {
    jest.resetModules();
    return require('../../../src/shared/utils/token.util');
  }

  test('signAccessToken and verifyAccessToken preserve safe auth claims', () => {
    const tokenUtil = loadTokenUtil();
    const payload = {
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'user@example.com',
      role: 'ADMIN',
    };

    const token = tokenUtil.signAccessToken(payload);
    const decoded = tokenUtil.verifyAccessToken(token);

    expect(typeof token).toBe('string');
    expect(decoded).toEqual(
      expect.objectContaining({
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'user@example.com',
        role: 'ADMIN',
      }),
    );
  });
});
