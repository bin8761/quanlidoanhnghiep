describe('auth.route', () => {
  function loadAuthRoute() {
    jest.resetModules();

    const routeMethods = {
      post: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      patch: jest.fn().mockReturnThis(),
      use: jest.fn().mockReturnThis(),
    };
    const Router = jest.fn(() => routeMethods);

    jest.doMock('express', () => ({
      Router,
    }));

    jest.doMock('../../../../src/modules/auth/auth.controller', () => ({
      login: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      verifyForgotPasswordOtp: jest.fn(),
      resetPassword: jest.fn(),
      createUser: jest.fn(),
      updateUserStatus: jest.fn(),
    }));

    jest.doMock('../../../../src/modules/auth/auth.validator', () => ({
      login: {},
      changePassword: {},
      forgotPassword: {},
      verifyForgotPasswordOtp: {},
      resetPassword: {},
      createUser: {},
      updateUserStatus: {},
    }));

    jest.doMock('../../../../src/middlewares/authenticate', () => 'authenticate-middleware');
    jest.doMock('../../../../src/middlewares/authorize', () => jest.fn(() => 'authorize-middleware'));
    jest.doMock('../../../../src/middlewares/passwordChangeGuard', () => 'password-change-guard');
    jest.doMock(
      '../../../../src/middlewares/tokenBucketRateLimit',
      () => jest.fn(() => 'rate-limit-middleware'),
    );
    jest.doMock('../../../../src/middlewares/validateRequest', () => jest.fn(() => 'validate-request-middleware'));

    return {
      authRoute: require('../../../../src/modules/auth/auth.route'),
      Router,
      routeMethods,
    };
  }

  test('registers auth endpoints on the router', () => {
    const { authRoute, Router, routeMethods } = loadAuthRoute();

    expect(authRoute).toBeTruthy();
    expect(Router).toHaveBeenCalled();
    expect(routeMethods.post).toHaveBeenCalled();
    expect(routeMethods.get).toHaveBeenCalled();
    expect(routeMethods.put).toHaveBeenCalled();
    expect(routeMethods.patch).toHaveBeenCalled();

    const postPaths = routeMethods.post.mock.calls.map((call) => call[0]);
    const getPaths = routeMethods.get.mock.calls.map((call) => call[0]);
    const putPaths = routeMethods.put.mock.calls.map((call) => call[0]);
    const patchPaths = routeMethods.patch.mock.calls.map((call) => call[0]);

    expect(postPaths).toEqual(
      expect.arrayContaining([
        '/login',
        '/logout',
        '/forgot-password',
        '/verify-forgot-password-otp',
        '/reset-password',
        '/users',
      ]),
    );
    expect(getPaths).toEqual(expect.arrayContaining(['/me']));
    expect(putPaths).toEqual(expect.arrayContaining(['/change-password']));
    expect(patchPaths).toEqual(expect.arrayContaining(['/users/:id/status']));
  });
});
