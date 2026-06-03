const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  quiet: true,
});

const ALLOWED_NODE_ENVS = ["development", "test", "production"];

function readRequiredString(key) {
  const value = process.env[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function readPositiveInteger(key) {
  const rawValue = readRequiredString(key);
  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }

  return parsedValue;
}

function readPositiveIntegerWithDefault(key, defaultValue) {
  if (!Number.isInteger(defaultValue) || defaultValue <= 0) {
    throw new Error(`Default value for ${key} must be a positive integer`);
  }

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

function readBoolean(key) {
  const rawValue = readRequiredString(key).toLowerCase();

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new Error(`Environment variable ${key} must be either "true" or "false"`);
}

function readNodeEnv() {
  const value = readRequiredString("NODE_ENV");

  if (!ALLOWED_NODE_ENVS.includes(value)) {
    throw new Error(
      `Environment variable NODE_ENV must be one of: ${ALLOWED_NODE_ENVS.join(", ")}`,
    );
  }

  return value;
}

function loadEnv() {
  const env = {
    port: readPositiveInteger("PORT"),
    nodeEnv: readNodeEnv(),
    databaseUrl: readRequiredString("DATABASE_URL"),
    jwtSecret: readRequiredString("JWT_SECRET"),
    jwtExpiresIn: readRequiredString("JWT_EXPIRES_IN"),
    defaultUserPassword: readRequiredString("DEFAULT_USER_PASSWORD"),
    otpExpiresSeconds: readPositiveInteger("OTP_EXPIRES_SECONDS"),
    otpMaxAttempts: readPositiveInteger("OTP_MAX_ATTEMPTS"),
    rateLimitBucketCapacity: readPositiveIntegerWithDefault(
      "RATE_LIMIT_BUCKET_CAPACITY",
      60,
    ),
    rateLimitRefillTokensPerSecond: readPositiveIntegerWithDefault(
      "RATE_LIMIT_REFILL_TOKENS_PER_SECOND",
      1,
    ),
    rateLimitTokensPerRequest: readPositiveIntegerWithDefault(
      "RATE_LIMIT_TOKENS_PER_REQUEST",
      1,
    ),
    mailHost: readRequiredString("MAIL_HOST"),
    mailPort: readPositiveInteger("MAIL_PORT"),
    mailSecure: readBoolean("MAIL_SECURE"),
    mailUser: readRequiredString("MAIL_USER"),
    mailPassword: readRequiredString("MAIL_PASSWORD"),
    mailFrom: readRequiredString("MAIL_FROM"),
  };

  return Object.freeze(env);
}

const env = loadEnv();

module.exports = env;
