describe('requestId middleware', () => {
  function loadRequestId() {
    jest.resetModules();
    jest.doMock('uuid', () => ({
      v4: jest.fn(() => 'generated-request-id'),
    }));
    return require('../../../src/middlewares/requestId');
  }

  test('reuses incoming x-request-id header when present', () => {
    const requestId = loadRequestId();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: {
        'x-request-id': 'external-request-id',
      },
    });
    const response = createMockResponse();
    const next = createNext();

    requestId(request, response, next);

    expect(request.requestId).toBe('external-request-id');
    expect(response.setHeader).toHaveBeenCalledWith('X-Request-Id', 'external-request-id');
    expect(next).toHaveBeenCalledWith();
  });

  test('generates and sets request id when missing', () => {
    const requestId = loadRequestId();
    const { createMockRequest, createMockResponse, createNext } = require('../../helpers/mockExpress');

    const request = createMockRequest({
      headers: {},
      id: undefined,
    });
    const response = createMockResponse();
    const next = createNext();

    requestId(request, response, next);

    expect(request.requestId).toBe('generated-request-id');
    expect(response.setHeader).toHaveBeenCalledWith('X-Request-Id', request.requestId);
    expect(next).toHaveBeenCalledWith();
  });
});
