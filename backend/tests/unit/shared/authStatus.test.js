describe('shared authStatus constants', () => {
  function loadAuthStatus() {
    jest.resetModules();
    return require('../../../src/shared/constants/authStatus');
  }

  test('exports stable auth status flags used by auth flows', () => {
    const AUTH_STATUS = loadAuthStatus();

    expect(AUTH_STATUS).toEqual(
      expect.objectContaining({
        ACTIVE: expect.any(String),
        INACTIVE: expect.any(String),
      }),
    );
  });
});
