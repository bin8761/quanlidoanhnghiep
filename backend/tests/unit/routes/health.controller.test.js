describe('health.controller', () => {
  function loadHealthController() {
    jest.resetModules();
    return require('../../../src/routes/health.controller');
  }

  test('returns standardized health success envelope', () => {
    const healthController = loadHealthController();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest();
    const response = createMockResponse();
    const next = createNext();

    healthController.check(request, response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      }),
    );
  });
});
