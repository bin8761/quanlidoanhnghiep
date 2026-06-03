process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appquanlidoanhnghiep';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'Password123';
process.env.OTP_EXPIRES_SECONDS = process.env.OTP_EXPIRES_SECONDS || '60';
process.env.OTP_MAX_ATTEMPTS = process.env.OTP_MAX_ATTEMPTS || '3';
process.env.RATE_LIMIT_BUCKET_CAPACITY = process.env.RATE_LIMIT_BUCKET_CAPACITY || '60';
process.env.RATE_LIMIT_REFILL_TOKENS_PER_SECOND =
  process.env.RATE_LIMIT_REFILL_TOKENS_PER_SECOND || '1';
process.env.RATE_LIMIT_TOKENS_PER_REQUEST =
  process.env.RATE_LIMIT_TOKENS_PER_REQUEST || '1';
process.env.MAIL_HOST = process.env.MAIL_HOST || 'smtp.example.com';
process.env.MAIL_PORT = process.env.MAIL_PORT || '587';
process.env.MAIL_SECURE = process.env.MAIL_SECURE || 'false';
process.env.MAIL_USER = process.env.MAIL_USER || 'noreply@example.com';
process.env.MAIL_PASSWORD = process.env.MAIL_PASSWORD || 'app-password';
process.env.MAIL_FROM = process.env.MAIL_FROM || 'noreply@example.com';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
