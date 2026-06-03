describe('shared roles constants', () => {
  function loadRoles() {
    jest.resetModules();
    return require('../../../src/shared/constants/roles');
  }

  test('exports stable ADMIN and USER roles', () => {
    const ROLES = loadRoles();

    expect(ROLES).toEqual(
      expect.objectContaining({
        ADMIN: 'ADMIN',
        USER: 'USER',
      }),
    );
  });
});
