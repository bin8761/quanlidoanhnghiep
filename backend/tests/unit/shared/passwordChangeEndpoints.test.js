describe('shared passwordChangeEndpoints constants', () => {
  function loadPasswordChangeEndpoints() {
    jest.resetModules();
    return require('../../../src/shared/constants/passwordChangeEndpoints');
  }

  test('exports array of allowed endpoints while password change is required', () => {
    const { PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS } = loadPasswordChangeEndpoints();

    expect(Array.isArray(PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS)).toBe(true);
    expect(PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS.length).toBeGreaterThan(0);
    expect(PASSWORD_CHANGE_ALLOWED_ENDPOINT_KEYS.every((item) => typeof item === 'string')).toBe(
      true,
    );
  });
});
