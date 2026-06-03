describe('config/env', () => {
  function loadEnvConfig() {
    jest.resetModules();
    return require('../../../src/config/env');
  }

  test('exports required auth/application env fields', () => {
    const env = loadEnvConfig();

    expect(env).toEqual(
      expect.objectContaining({
        nodeEnv: expect.any(String),
        port: expect.any(Number),
        databaseUrl: expect.any(String),
        jwtSecret: expect.any(String),
        jwtExpiresIn: expect.any(String),
        defaultUserPassword: expect.any(String),
      }),
    );
  });
});
