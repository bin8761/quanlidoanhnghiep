describe('config/logger', () => {
  function loadLoggerConfig() {
    jest.resetModules();

    const pinoInstance = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const pino = jest.fn(() => pinoInstance);
    pino.stdTimeFunctions = {
      isoTime: jest.fn(),
    };

    jest.doMock('pino', () => pino);

    return {
      logger: require('../../../src/config/logger'),
      pino,
    };
  }

  test('creates a shared logger instance with configured transport and format', () => {
    const { logger, pino } = loadLoggerConfig();

    expect(logger).toBeTruthy();
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: expect.any(String),
        redact: expect.objectContaining({
          paths: expect.any(Array),
        }),
      }),
      undefined,
    );
  });
});
