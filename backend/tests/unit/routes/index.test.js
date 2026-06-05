describe('routes/index', () => {
  function loadRoutesIndex() {
    jest.resetModules();

    const rootRouter = {
      use: jest.fn(),
    };
    const apiRouter = {
      use: jest.fn(),
      get: jest.fn(),
    };
    const routerInstances = [rootRouter, apiRouter];

    const Router = jest.fn(() => routerInstances.shift());

    jest.doMock('express', () => ({
      Router,
    }));

    jest.doMock('../../../src/routes/health.controller', () => ({
      check: jest.fn(),
    }));

    jest.doMock('../../../src/modules/auth/auth.route', () => ({ mocked: 'authRouter' }));
    jest.doMock('../../../src/modules/categories/category.route', () => ({
      mocked: 'categoryRouter',
    }));
    jest.doMock('../../../src/modules/auth/auth.constants', () => ({
      AUTH_ROUTE_PREFIX: '/auth',
    }));

    return {
      routesIndex: require('../../../src/routes/index'),
      rootRouter,
      apiRouter,
      Router,
    };
  }

  test('mounts health and auth routes on the shared router', () => {
    const { routesIndex, rootRouter, apiRouter, Router } = loadRoutesIndex();

    expect(routesIndex).toBeTruthy();
    expect(Router).toHaveBeenCalledTimes(2);
    expect(apiRouter.get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(apiRouter.use).toHaveBeenCalledWith('/auth', expect.anything());
    expect(apiRouter.use).toHaveBeenCalledWith('/categories', expect.anything());
    expect(rootRouter.use).toHaveBeenCalledWith(
      '/api',
      expect.objectContaining({
        get: apiRouter.get,
        use: apiRouter.use,
      }),
    );
  });
});
