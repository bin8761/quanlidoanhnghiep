const { sendError } = require("../shared/response/apiResponse");
const ERROR_CODES = require("../shared/errors/errorCodes");

const DEFAULT_BUCKET_CAPACITY = 60;
const DEFAULT_REFILL_TOKENS_PER_SECOND = 1;
const DEFAULT_TOKENS_PER_REQUEST = 1;
const RATE_LIMIT_EXCEEDED_ERROR_CODE = ERROR_CODES.RATE_LIMIT_EXCEEDED;
const RATE_LIMIT_EXCEEDED_MESSAGE = "Too many requests. Please try again later.";

function readPositiveIntegerFromEnvironment(key, defaultValue) {
  const rawValue = process.env[key];

  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }

  return parsedValue;
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
}

function calculateFullRefillDurationMs(capacity, refillTokensPerSecond) {
  const secondsToRefill = capacity / refillTokensPerSecond;

  return Math.ceil(secondsToRefill * 1000);
}

function resolveClientIp(req) {
  if (req && typeof req.ip === "string" && req.ip.trim() !== "") {
    return req.ip.trim();
  }

  const forwardedForHeader = req && typeof req.get === "function"
    ? req.get("x-forwarded-for")
    : undefined;

  if (typeof forwardedForHeader === "string" && forwardedForHeader.trim() !== "") {
    return forwardedForHeader.split(",")[0].trim();
  }

  if (
    req &&
    req.socket &&
    typeof req.socket.remoteAddress === "string" &&
    req.socket.remoteAddress.trim() !== ""
  ) {
    return req.socket.remoteAddress.trim();
  }

  if (
    req &&
    req.connection &&
    typeof req.connection.remoteAddress === "string" &&
    req.connection.remoteAddress.trim() !== ""
  ) {
    return req.connection.remoteAddress.trim();
  }

  return "unknown";
}

function refillBucket(bucket, options, currentTimestampMs) {
  const elapsedSeconds = Math.max(0, (currentTimestampMs - bucket.lastRefillAtMs) / 1000);
  const refilledTokens = elapsedSeconds * options.refillTokensPerSecond;

  bucket.tokens = Math.min(options.capacity, bucket.tokens + refilledTokens);
  bucket.lastRefillAtMs = currentTimestampMs;

  return bucket;
}

function createBucketState(capacity, currentTimestampMs) {
  return {
    tokens: capacity,
    lastRefillAtMs: currentTimestampMs,
  };
}

function calculateRetryAfterSeconds(remainingTokens, tokensPerRequest, refillTokensPerSecond) {
  const missingTokens = Math.max(0, tokensPerRequest - remainingTokens);

  if (missingTokens === 0) {
    return 0;
  }

  return Math.ceil(missingTokens / refillTokensPerSecond);
}

function setRetryAfterHeader(res, retryAfterSeconds) {
  const headerValue = String(retryAfterSeconds);

  if (res && typeof res.set === "function") {
    res.set("Retry-After", headerValue);
    return;
  }

  if (res && typeof res.setHeader === "function") {
    res.setHeader("Retry-After", headerValue);
  }
}

function normalizeRequestPath(req) {
  if (req && typeof req.originalUrl === "string" && req.originalUrl.trim() !== "") {
    return req.originalUrl.split("?")[0].trim();
  }

  if (req && typeof req.path === "string" && req.path.trim() !== "") {
    return req.path.trim();
  }

  if (req && typeof req.url === "string" && req.url.trim() !== "") {
    return req.url.split("?")[0].trim();
  }

  return "";
}

function isHealthCheckRequest(req) {
  const method = req && typeof req.method === "string" ? req.method.toUpperCase() : "";
  const path = normalizeRequestPath(req);

  return method === "GET" && path === "/api/health";
}

function cleanupStaleBuckets(bucketStore, currentTimestampMs, staleBucketThresholdMs) {
  let deletedCount = 0;

  for (const [bucketKey, bucket] of bucketStore.entries()) {
    const idleDurationMs = currentTimestampMs - bucket.lastRefillAtMs;

    if (idleDurationMs >= staleBucketThresholdMs) {
      bucketStore.delete(bucketKey);
      deletedCount += 1;
    }
  }

  return deletedCount;
}

function createTokenBucketRateLimit(options = {}) {
  const capacity =
    options.capacity ??
    readPositiveIntegerFromEnvironment(
      "RATE_LIMIT_BUCKET_CAPACITY",
      DEFAULT_BUCKET_CAPACITY,
    );
  const refillTokensPerSecond =
    options.refillTokensPerSecond ??
    readPositiveIntegerFromEnvironment(
      "RATE_LIMIT_REFILL_TOKENS_PER_SECOND",
      DEFAULT_REFILL_TOKENS_PER_SECOND,
    );
  const tokensPerRequest =
    options.tokensPerRequest ??
    readPositiveIntegerFromEnvironment(
      "RATE_LIMIT_TOKENS_PER_REQUEST",
      DEFAULT_TOKENS_PER_REQUEST,
    );
  const bucketStore = options.bucketStore ?? new Map();
  const nowProvider = options.nowProvider ?? Date.now;

  assertPositiveInteger(capacity, "capacity");
  assertPositiveInteger(refillTokensPerSecond, "refillTokensPerSecond");
  assertPositiveInteger(tokensPerRequest, "tokensPerRequest");

  if (!(bucketStore instanceof Map)) {
    throw new Error("bucketStore must be a Map instance");
  }

  if (typeof nowProvider !== "function") {
    throw new Error("nowProvider must be a function");
  }

  const staleBucketThresholdMs =
    options.staleBucketThresholdMs ??
    calculateFullRefillDurationMs(capacity, refillTokensPerSecond);
  const cleanupIntervalMs = options.cleanupIntervalMs ?? staleBucketThresholdMs;

  assertPositiveInteger(staleBucketThresholdMs, "staleBucketThresholdMs");
  assertPositiveInteger(cleanupIntervalMs, "cleanupIntervalMs");

  const resolvedOptions = {
    capacity,
    refillTokensPerSecond,
    tokensPerRequest,
    staleBucketThresholdMs,
    cleanupIntervalMs,
  };
  let lastCleanupAtMs = 0;

  function tokenBucketRateLimit(req, res, next) {
    if (isHealthCheckRequest(req)) {
      return next();
    }

    const currentTimestampMs = nowProvider();

    if (currentTimestampMs - lastCleanupAtMs >= resolvedOptions.cleanupIntervalMs) {
      cleanupStaleBuckets(
        bucketStore,
        currentTimestampMs,
        resolvedOptions.staleBucketThresholdMs,
      );
      lastCleanupAtMs = currentTimestampMs;
    }

    const bucketKey = resolveClientIp(req);
    const bucket =
      bucketStore.get(bucketKey) ?? createBucketState(resolvedOptions.capacity, currentTimestampMs);

    refillBucket(bucket, resolvedOptions, currentTimestampMs);

    const hasEnoughTokens = bucket.tokens >= resolvedOptions.tokensPerRequest;

    if (hasEnoughTokens) {
      bucket.tokens -= resolvedOptions.tokensPerRequest;
    }

    bucketStore.set(bucketKey, bucket);

    const retryAfterSeconds = hasEnoughTokens
      ? 0
      : calculateRetryAfterSeconds(
          bucket.tokens,
          resolvedOptions.tokensPerRequest,
          resolvedOptions.refillTokensPerSecond,
        );

    const rateLimitState = {
      key: bucketKey,
      allowed: hasEnoughTokens,
      remainingTokens: Math.max(0, Number(bucket.tokens.toFixed(3))),
      capacity: resolvedOptions.capacity,
      refillTokensPerSecond: resolvedOptions.refillTokensPerSecond,
      tokensPerRequest: resolvedOptions.tokensPerRequest,
      retryAfterSeconds,
    };

    req.rateLimit = rateLimitState;
    res.locals.rateLimit = rateLimitState;

    if (!hasEnoughTokens) {
      setRetryAfterHeader(res, retryAfterSeconds);

      return sendError(res, {
        statusCode: 429,
        message: RATE_LIMIT_EXCEEDED_MESSAGE,
        errorCode: RATE_LIMIT_EXCEEDED_ERROR_CODE,
        requestId: req.requestId,
      });
    }

    next();
  }

  tokenBucketRateLimit.bucketStore = bucketStore;
  tokenBucketRateLimit.cleanupStaleBuckets = (currentTimestampMs) =>
    cleanupStaleBuckets(
      bucketStore,
      currentTimestampMs,
      resolvedOptions.staleBucketThresholdMs,
    );

  return tokenBucketRateLimit;
}

module.exports = createTokenBucketRateLimit;
module.exports.createTokenBucketRateLimit = createTokenBucketRateLimit;
module.exports.createBucketState = createBucketState;
module.exports.calculateRetryAfterSeconds = calculateRetryAfterSeconds;
module.exports.calculateFullRefillDurationMs = calculateFullRefillDurationMs;
module.exports.cleanupStaleBuckets = cleanupStaleBuckets;
module.exports.isHealthCheckRequest = isHealthCheckRequest;
module.exports.normalizeRequestPath = normalizeRequestPath;
module.exports.refillBucket = refillBucket;
module.exports.resolveClientIp = resolveClientIp;
module.exports.DEFAULT_BUCKET_CAPACITY = DEFAULT_BUCKET_CAPACITY;
module.exports.DEFAULT_REFILL_TOKENS_PER_SECOND = DEFAULT_REFILL_TOKENS_PER_SECOND;
module.exports.DEFAULT_TOKENS_PER_REQUEST = DEFAULT_TOKENS_PER_REQUEST;
module.exports.RATE_LIMIT_EXCEEDED_ERROR_CODE = RATE_LIMIT_EXCEEDED_ERROR_CODE;
module.exports.RATE_LIMIT_EXCEEDED_MESSAGE = RATE_LIMIT_EXCEEDED_MESSAGE;
module.exports.readPositiveIntegerFromEnvironment = readPositiveIntegerFromEnvironment;
module.exports.setRetryAfterHeader = setRetryAfterHeader;
