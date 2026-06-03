const { v4: uuidv4 } = require("uuid");

const REQUEST_ID_HEADER = "X-Request-Id";

function getRequestId(req) {
  const incomingRequestId = req.get(REQUEST_ID_HEADER);

  if (typeof incomingRequestId === "string" && incomingRequestId.trim() !== "") {
    return incomingRequestId.trim();
  }

  return uuidv4();
}

function requestId(req, res, next) {
  const resolvedRequestId = getRequestId(req);

  req.requestId = resolvedRequestId;
  res.locals.requestId = resolvedRequestId;
  res.setHeader(REQUEST_ID_HEADER, resolvedRequestId);

  next();
}

module.exports = requestId;
