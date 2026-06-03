function createMockRequest(overrides = {}) {
  const headers = overrides.headers || {};

  return {
    body: {},
    params: {},
    query: {},
    headers,
    user: undefined,
    id: 'req-test-id',
    requestId: 'req-test-id',
    get: jest.fn((headerName) => {
      const matchingKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === String(headerName).toLowerCase(),
      );

      return matchingKey ? headers[matchingKey] : undefined;
    }),
    ...overrides,
  };
}

function createMockResponse() {
  const response = {};

  response.locals = {};
  response.statusCode = 200;
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.setHeader = jest.fn().mockReturnValue(response);
  response.on = jest.fn((eventName, handler) => {
    response.__events = response.__events || {};
    response.__events[eventName] = handler;
    return response;
  });

  return response;
}

function createNext() {
  return jest.fn();
}

module.exports = {
  createMockRequest,
  createMockResponse,
  createNext,
};
