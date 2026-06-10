describe('app/app', () => {
  function loadAppModule() {
    jest.resetModules();

    const use = jest.fn();
    const disable = jest.fn();
    const appInstance = {
      use,
      disable,
    };
    const expressFn = jest.fn(() => appInstance);
    expressFn.json = jest.fn(() => 'json-middleware');
    expressFn.urlencoded = jest.fn(() => 'urlencoded-middleware');
    expressFn.static = jest.fn(() => 'static-middleware');

    jest.doMock('express', () => expressFn);
    jest.doMock('cors', () => jest.fn(() => 'cors-middleware'));
    jest.doMock('../../../src/routes', () => 'routes-middleware');
    jest.doMock('../../../src/middlewares/requestId', () => 'request-id-middleware');
    jest.doMock('../../../src/middlewares/requestLogger', () => 'request-logger-middleware');
    jest.doMock('../../../src/middlewares/tokenBucketRateLimit', () => 'rate-limit-middleware');
    jest.doMock('../../../src/middlewares/errorHandler', () => 'error-handler-middleware');

    return {
      app: require('../../../src/app/app'),
      expressFn,
      use,
      disable,
    };
  }

  test('composes core middlewares and routes on the express app', () => {
    const { app, expressFn, use, disable } = loadAppModule();

    expect(app).toBeTruthy();
    expect(expressFn).toHaveBeenCalled();
    expect(disable).toHaveBeenCalledWith('x-powered-by');
    expect(use).toHaveBeenCalled();
    expect(use.mock.calls.flat()).toEqual(
      expect.arrayContaining([
        'request-id-middleware',
        'request-logger-middleware',
        'static-middleware',
        'routes-middleware',
        'error-handler-middleware',
      ]),
    );
  });
});
