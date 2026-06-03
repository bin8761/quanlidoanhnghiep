# Task Breakdown: Backend Foundation And Auth

Source TDD: `docs/tdd/backend-foundation-auth-tdd.md`

## Project Setup

- [x] Task 1: Create the `backend/` project folder with `package.json` for a Node.js/Express API. (Completed)
- [x] Task 2: Install runtime dependencies: `express`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `nodemailer`, `zod`, `dotenv`, `cors`, `helmet`, `pino`, and `uuid`. (Completed)
- [x] Task 3: Install development dependencies: `prisma`, `jest`, `supertest`, `nodemon`, `eslint`, and `prettier`. (Completed)
- [x] Task 4: Configure npm scripts for local development, start, test, and lint commands. (Completed)
- [x] Task 5: Create the base folder structure under `backend/src` for `app`, `config`, `middlewares`, `modules/auth`, `routes`, `shared`, and `tests`. (Completed)
- [x] Task 6: Create `backend/.env.example` with all TDD-defined keys, including `DATABASE_URL`, JWT, OTP, rate limit, and Gmail SMTP settings. (Completed)
- [x] Task 7: Implement startup environment validation in `src/config/env.js` for required local configuration keys. (Completed)

## Express Foundation

- [x] Task 8: Create `src/app/app.js` and configure Express JSON parsing, payload size limits, `helmet`, and local CORS. (Completed)
- [x] Task 9: Create `src/app/server.js` to load config, start the server, and log port plus `NODE_ENV` on startup. (Completed)
- [x] Task 10: Create `src/routes/index.js` to mount all API routes under `/api`. (Completed)
- [x] Task 11: Add `GET /api/health` route and controller returning the standard success envelope. (Completed)
- [x] Task 12: Create shared success and error response helpers in `src/shared/response/apiResponse.js`. (Completed)
- [x] Task 13: Create `AppError` and shared error codes in `src/shared/errors`. (Completed)
- [x] Task 14: Implement centralized `errorHandler` middleware with controlled client messages and backend-only stack traces. (Completed)
- [x] Task 15: Implement `validateRequest` middleware using `zod` schemas. (Completed)

## Prisma And Data Model

- [x] Task 16: Create `prisma/schema.prisma` with `Employee`, `User`, `PasswordResetOtp`, and `UserRole` models from the TDD. (Completed)
- [x] Task 17: Add Prisma indexes and uniqueness constraints for employee email/code, user email, user employee linkage, and OTP lookup fields. (Completed)
- [x] Task 18: Document that the user must run Prisma initialization, migration, and client generation commands; do not run Prisma CLI from the assistant workflow. (Completed)
- [x] Task 19: Create `src/config/database.js` to initialize Prisma Client and expose a shared database client. (Completed)
- [x] Task 20: Add database startup/readiness logging for successful and failed Prisma connection checks. (Completed)
- [x] Task 21: Create seed documentation or a seed script plan for one fixed `ADMIN`, one employee without a user, one employee with a user, one first-login user, and one active user. (Completed)

## Shared Utilities

- [x] Task 22: Implement `password.util.js` for bcrypt password hashing and verification. (Completed)
- [x] Task 23: Implement `otp.util.js` for six-digit OTP generation, OTP hashing, OTP verification, and 60-second expiry calculation. (Completed)
- [x] Task 24: Implement `token.util.js` for JWT signing and verification with `userId`, `role`, and `email`. (Completed)
- [x] Task 25: Implement `date.util.js` helpers for expiry checks and date comparisons. (Completed)
- [x] Task 26: Add shared constants for roles, auth status, allowed password-change endpoints, and OTP policy values. (Completed)

## Observability And Rate Limiting

- [x] Task 27: Implement `requestId` middleware that uses `X-Request-Id` or generates a UUID. (Completed)
- [x] Task 28: Implement request logging middleware that logs request ID, method, path, status code, duration, and safe user metadata. (Completed)
- [x] Task 29: Configure `pino` logging with safe metadata and no secrets, raw OTPs, passwords, or full JWT values. (Completed)
- [x] Task 30: Implement shared `tokenBucketRateLimit` middleware using an in-memory IP-based `Map`. (Completed)
- [x] Task 31: Configure Token Bucket settings from environment variables with defaults: capacity `60`, refill `1` token per second, and cost `1` token per request. (Completed)
- [x] Task 32: Return `RATE_LIMIT_EXCEEDED` with the standard error envelope when the bucket is empty. (Completed)
- [x] Task 33: Add `Retry-After` header calculation based on missing tokens and refill rate. (Completed)
- [x] Task 34: Exclude `GET /api/health` from Token Bucket rate limiting. (Completed)
- [x] Task 35: Add stale bucket cleanup to prevent unbounded in-memory growth during long local sessions. (Completed)

## Authentication Middleware

- [x] Task 36: Implement `authenticate` middleware to reject missing, malformed, expired, or invalid JWT bearer tokens. (Completed)
- [x] Task 37: Implement `authorize` middleware for role checks, including `ADMIN`-only routes. (Completed)
- [x] Task 38: Implement `passwordChangeGuard` middleware to block normal protected APIs when `mustChangePassword = true`. (Completed)
- [x] Task 39: Allow only `GET /api/auth/me`, `PUT /api/auth/change-password`, and `POST /api/auth/logout` during required password change. (Completed)
- [x] Task 40: Ensure authentication middleware attaches safe user context to `req.user`. (Completed)

## Auth Module Structure

- [x] Task 41: Create `auth.route.js`, `auth.controller.js`, `auth.service.js`, `auth.repository.js`, `auth.validator.js`, and `auth.constants.js`. (Completed)
- [x] Task 42: Register auth routes in `src/routes/index.js`. (Completed)
- [x] Task 43: Add auth validators for login, change password, forgot password, verify OTP, reset password, create user, and update user status payloads. (Completed)
- [x] Task 44: Add auth constants for error messages, safe response messages, OTP policy, password policy, and allowed first-login endpoints. (Completed)
- [x] Task 45: Implement auth repository methods for finding users by email/id, updating login metadata, updating passwords, updating status, and reading employee records. (Completed)
- [x] Task 46: Implement auth repository methods for creating users, checking duplicate user email/employee account, creating OTPs, finding latest active OTP, invalidating old OTPs, incrementing OTP attempts, marking OTP verified, and marking OTP used. (Completed)

## Login And Current User

- [x] Task 47: Implement `POST /api/auth/login` route with Token Bucket rate limiting and validation. (Completed)
- [x] Task 48: Implement login controller to delegate request data to `authService.login`. (Completed)
- [x] Task 49: Implement login service logic for email lookup, active account check, password hash verification, JWT signing, and `lastLoginAt` update. (Completed)
- [x] Task 50: Return login response with `accessToken` and safe user context, including `mustChangePassword`. (Completed)
- [x] Task 51: Return `AUTH_INVALID_CREDENTIALS` for invalid email or password without leaking which value failed. (Completed)
- [x] Task 52: Return `AUTH_ACCOUNT_INACTIVE` for inactive accounts. (Completed)
- [x] Task 53: Implement `GET /api/auth/me` route with authentication. (Completed)
- [x] Task 54: Implement current-user service response with safe user fields only. (Completed)

## Logout And Password Change

- [x] Task 55: Implement `POST /api/auth/logout` route with authentication. (Completed)
- [x] Task 56: Implement logout controller/service to return success and write a safe logout log entry. (Completed)
- [x] Task 57: Document that logout does not revoke issued JWTs because token blacklist and refresh tokens are out of scope. (Completed)
- [x] Task 58: Implement `PUT /api/auth/change-password` route with authentication and validation. (Completed)
- [x] Task 59: Implement change-password service logic for current password verification, password policy enforcement, confirmation match, bcrypt hashing, and database update. (Completed)
- [x] Task 60: Set `mustChangePassword = false` after successful password change. (Completed)
- [x] Task 61: Return `AUTH_PASSWORD_MISMATCH` for password mismatch scenarios. (Completed)

## Forgot Password OTP

- [x] Task 62: Implement `POST /api/auth/forgot-password` route with Token Bucket rate limiting and validation. (Completed)
- [x] Task 63: Implement forgot-password service logic that returns generic success for unknown, inactive, or admin accounts. (Completed)
- [x] Task 64: Implement eligible user lookup for active `USER` accounts only. (Completed)
- [x] Task 65: Implement active OTP detection and decide whether to return `AUTH_OTP_RESEND_TOO_SOON` for known eligible users. (Completed)
- [x] Task 66: Invalidate older active OTPs before creating a new OTP. (Completed)
- [x] Task 67: Generate a six-digit raw OTP, hash it, store it with 60-second expiry, and never log the raw value. (Completed)
- [x] Task 68: Configure Gmail SMTP transport in `src/config/mail.js`. (Completed)
- [x] Task 69: Implement OTP email sending through Gmail SMTP with safe failure logging. (Completed)
- [x] Task 70: Implement controlled mail failure handling for eligible users. (Completed)

## OTP Verification And Password Reset

- [x] Task 71: Implement `POST /api/auth/verify-forgot-password-otp` route with validation. (Completed)
- [x] Task 72: Implement OTP verification service logic using the latest active OTP for the eligible user. (Completed)
- [x] Task 73: Increment `attemptCount` for invalid OTP submissions. (Completed)
- [x] Task 74: Reject OTP verification after 3 failed attempts with `AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED`. (Completed)
- [x] Task 75: Reject expired OTPs with `AUTH_OTP_EXPIRED`. (Completed)
- [x] Task 76: Mark OTP as verified by setting `verifiedAt` after successful verification. (Completed)
- [x] Task 77: Implement `POST /api/auth/reset-password` route with validation. (Completed)
- [x] Task 78: Implement reset-password service logic requiring a verified, unused, unexpired OTP below the failed-attempt limit. (Completed)
- [x] Task 79: Re-check the submitted OTP value during password reset. (Completed)
- [x] Task 80: Hash and store the new password during reset. (Completed)
- [x] Task 81: Set `mustChangePassword = false` after successful reset. (Completed)
- [x] Task 82: Mark the OTP as used by setting `usedAt` after successful reset. (Completed)
- [x] Task 83: Return `AUTH_OTP_NOT_VERIFIED`, `AUTH_INVALID_OTP`, `AUTH_OTP_EXPIRED`, or `AUTH_OTP_ATTEMPT_LIMIT_EXCEEDED` for reset failure states. (Completed)

## Admin User Account Management

- [x] Task 84: Implement `POST /api/auth/users` route with authentication, password-change guard, `authorize(ADMIN)`, and validation. (Completed)
- [x] Task 85: Implement create-user controller to delegate `employeeId` to the auth service. (Completed)
- [x] Task 86: Implement create-employee-user service logic to verify the employee exists. (Completed)
- [x] Task 87: Reject duplicate user email or duplicate employee account with `AUTH_USER_ALREADY_EXISTS`. (Completed)
- [x] Task 88: Hash `DEFAULT_USER_PASSWORD` before creating the new account. (Completed)
- [x] Task 89: Create a `USER` account with employee email, `isActive = true`, and `mustChangePassword = true`. (Completed)
- [x] Task 90: Implement `PATCH /api/auth/users/:id/status` route with authentication, password-change guard, `authorize(ADMIN)`, and validation. (Completed)
- [x] Task 91: Implement update-user-status service logic to update only `isActive`. (Completed)
- [x] Task 92: Ensure status updates deactivate login without deleting user data. (Completed)

## Error Codes And Response Contracts

- [x] Task 93: Add all TDD-defined auth and system error codes to `shared/errors/errorCodes.js`. (Completed)
- [x] Task 94: Ensure every endpoint returns the standard success envelope. (Completed)
- [x] Task 95: Ensure every controlled failure returns the standard error envelope with `message`, `errorCode`, and `requestId` when available. (Completed)
- [x] Task 96: Ensure validation failures consistently return `VALIDATION_ERROR`. (Completed)
- [x] Task 97: Ensure response bodies never include `passwordHash`, `otpCodeHash`, raw OTP, raw password, or full JWT values. (Completed)

## Unit Tests

- [x] Task 98: Configure Jest test setup and shared test helpers. (Completed)
- [x] Task 99: Write unit tests for `password.util` hashing and verification. (Completed)
- [x] Task 100: Write unit tests for `otp.util` generation, hashing, verification, and 60-second expiry. (Completed)
- [x] Task 101: Write unit tests for `token.util` JWT signing and verification. (Completed)
- [x] Task 102: Write unit tests for `date.util` expiry boundary behavior. (Completed)
- [x] Task 103: Write unit tests for `auth.service.login` success, invalid credentials, and inactive account cases. (Completed)
- [x] Task 104: Write unit tests for `auth.service.changePassword` current password mismatch, confirmation mismatch, and successful password update. (Completed)
- [x] Task 105: Write unit tests for `auth.service.requestForgotPasswordOtp` eligible user, unknown email generic success, admin generic path, and active OTP resend-too-soon path. (Completed)
- [x] Task 106: Write unit tests for `auth.service.verifyForgotPasswordOtp` valid OTP, invalid OTP attempt increment, expired OTP, and 3-attempt limit. (Completed)
- [x] Task 107: Write unit tests for `auth.service.resetPassword` requiring verified OTP, rejecting expired/used OTP, updating password, and marking OTP used. (Completed)
- [x] Task 108: Write unit tests for `passwordChangeGuard` allowed and blocked endpoint behavior. (Completed)
- [x] Task 109: Write unit tests for Token Bucket refill, token consumption, empty bucket rejection, standard error envelope, and `Retry-After`. (Completed)

## API And Integration Tests

- [x] Task 110: Configure Supertest against the Express app without starting a real server process. (Completed)
- [x] Task 111: Mock Gmail SMTP for automated tests. (Completed)
- [x] Task 112: Choose and document the Prisma test database strategy before running integration tests. (Completed)
- [x] Task 113: Add Supertest coverage for `GET /api/health`. (Completed)
- [x] Task 114: Add Supertest coverage for login validation failure. (Completed)
- [x] Task 115: Add Supertest coverage for Token Bucket exhaustion returning `RATE_LIMIT_EXCEEDED`. (Completed)
- [x] Task 116: Add Supertest coverage proving `GET /api/health` is not blocked by Token Bucket rate limiting. (Completed)
- [x] Task 117: Add Supertest coverage for successful login returning JWT and safe user context. (Completed)
- [x] Task 118: Add Supertest coverage for `GET /api/auth/me` rejecting missing token. (Completed)
- [x] Task 119: Add Supertest coverage for `GET /api/auth/me` returning current user with a valid token. (Completed)
- [x] Task 120: Add Supertest coverage for change password clearing `mustChangePassword`. (Completed)
- [x] Task 121: Add Supertest coverage for `POST /api/auth/users` rejecting non-admin users. (Completed)
- [x] Task 122: Add Supertest coverage for admin creating a `USER` from an employee. (Completed)
- [x] Task 123: Add Supertest coverage for updating user `isActive`. (Completed)
- [x] Task 124: Add Supertest coverage for forgot-password generic success for unknown email. (Completed)
- [x] Task 125: Add Supertest coverage for verifying a valid forgot-password OTP. (Completed)
- [x] Task 126: Add Supertest coverage for reset-password rejecting unverified OTP. (Completed)
- [x] Task 127: Add Supertest coverage for reset-password succeeding with a verified OTP. (Completed)
- [x] Task 128: Add Supertest coverage for a normal protected test route returning `AUTH_PASSWORD_CHANGE_REQUIRED`. (Completed)

## Documentation And Handoff

- [ ] Task 129: Create a backend integration guide documenting folder structure, module creation pattern, route mounting, and repository pattern.
- [ ] Task 130: Document auth endpoint list, request payloads, response shapes, and error codes for frontend handoff.
- [ ] Task 131: Document `Authorization: Bearer <accessToken>` usage for protected frontend calls.
- [ ] Task 132: Document frontend handling for `mustChangePassword` and `AUTH_PASSWORD_CHANGE_REQUIRED`.
- [ ] Task 133: Document forgot-password flow: `forgot-password -> verify-forgot-password-otp -> reset-password`.
- [ ] Task 134: Document local `.env` setup and Gmail app password requirements without exposing secrets.
- [ ] Task 135: Document that production AWS deployment, Redis, queues, refresh tokens, token blacklist, MFA, metrics dashboards, alerting, and centralized logs are out of scope for this TDD.
- [ ] Task 136: Document the user-run Prisma commands needed after schema creation and before local testing.

## Open Questions To Resolve Before Implementation

- [ ] Task 137: Confirm whether backend implementation will use JavaScript or TypeScript; current TDD assumes JavaScript `.js` paths.
- [ ] Task 138: Confirm exact local frontend origin for CORS once the frontend dev server is known.
- [ ] Task 139: Confirm whether `AUTH_OTP_RESEND_TOO_SOON` should be exposed to eligible users or hidden behind generic success.
- [ ] Task 140: Confirm whether the first fixed `ADMIN` account will be created by seed script, manual database insert, or one-time setup script.

## Done Criteria

- [ ] Task 141: Verify the backend runs locally with valid environment configuration.
- [ ] Task 142: Verify `GET /api/health` works.
- [ ] Task 143: Verify Prisma can connect to local XAMPP MySQL after the user runs Prisma commands.
- [ ] Task 144: Verify auth APIs work end to end with seeded/local test data.
- [ ] Task 145: Verify protected APIs reject missing/invalid JWT and insufficient roles.
- [ ] Task 146: Verify normal protected APIs are blocked until first-login password change is completed.
- [ ] Task 147: Verify basic request logging, request IDs, startup logs, database logs, and mail failure logs exist.
- [ ] Task 148: Verify tests pass for utilities, services, middleware, and API routes.
- [ ] Task 149: Verify frontend and backend handoff documentation is complete enough for other team members to integrate.
