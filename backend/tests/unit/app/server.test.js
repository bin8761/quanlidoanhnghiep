describe('app/server', () => {
  function loadServerModule() {
    jest.resetModules();

    const listen = jest.fn((port, callback) => {
      if (typeof callback === 'function') {
        callback();
      }

      return { close: jest.fn(), on: jest.fn() };
    });

    jest.doMock('../../../src/app/app', () => ({
      listen,
    }));
    jest.doMock('../../../src/config/database', () => ({
      checkDatabaseConnection: jest.fn().mockResolvedValue(true),
    }));

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    jest.doMock('../../../src/config/logger', () => logger);

    return {
      serverModule: require('../../../src/app/server'),
      listen,
      logger,
    };
  }

  test('starts the app listening and logs startup info', () => {
    const { serverModule, listen, logger } = loadServerModule();

    expect(serverModule).toBeTruthy();
    expect(typeof serverModule.startServer).toBe('function');
    return serverModule.startServer().then(() => {
      expect(listen).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
