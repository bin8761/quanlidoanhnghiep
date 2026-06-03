describe('apiResponse helpers', () => {
  function loadApiResponse() {
    jest.resetModules();
    return require('../../../src/shared/response/apiResponse');
  }

  test('sendSuccess returns standard success envelope with default data object', () => {
    const { sendSuccess } = loadApiResponse();
    const { createMockResponse } = require('../../helpers/mockExpress');
    const response = createMockResponse();

    sendSuccess(response, {
      message: 'Operation successful',
    });

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: 'Operation successful',
      data: {},
    });
  });

  test('sendError returns standard error envelope with optional requestId and details', () => {
    const { sendError } = loadApiResponse();
    const { createMockResponse } = require('../../helpers/mockExpress');
    const response = createMockResponse();

    sendError(response, {
      statusCode: 400,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      requestId: 'req-api-error-1',
      details: [{ path: 'body.email', message: 'Invalid email' }],
    });

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      requestId: 'req-api-error-1',
      details: [{ path: 'body.email', message: 'Invalid email' }],
    });
  });
});
