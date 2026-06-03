# Backend Foundation And Auth

> Self-contained specification for the Person 1 backend foundation and authentication module of the Enterprise Asset Management MVP.

## Overview

### Problem Statement

The Enterprise Asset Management MVP needs a stable backend foundation before the team can safely build asset, employee, maintenance, inventory, and reporting modules. Without a shared foundation, each backend member may implement routing, validation, errors, authentication, and database access differently, increasing integration risk.

### Solution

Build a Node.js/Express backend foundation using a module-based and layered architecture, then implement the first module: authentication. The auth module must support admin-created employee accounts, email login, JWT access tokens, first-login password change, logout, and user forgot-password by email OTP.

### Target Users

- **Primary**: Backend developers extending the MVP with new modules.
- **Secondary**: Frontend developers integrating login, first-login password change, and forgot-password screens.
- **Business users**: Admin users who create employee login accounts, and employee users who sign in to use the asset management system.
- **Technical level**: Student/internship project team using React, Node.js/Express, and MySQL.

### Success Criteria

- [ ] Backend can run locally as an Express API.
- [ ] `GET /api/health` returns a successful health response.
- [ ] MySQL connection works with local XAMPP and can later target AWS RDS MySQL.
- [ ] Shared route registration, response format, validation, errors, logging, and auth middleware are in place.
- [ ] Auth APIs work for login, logout, current user, password change, forgot-password OTP, OTP verification, password reset, admin account creation, and account status updates.
- [ ] New employee user accounts must change the default password on first login.
- [ ] Backend blocks normal protected APIs while `mustChangePassword = true`.
- [ ] Frontend can consume a stable auth contract and error-code list.
- [ ] Other backend members can add new modules without changing the shared foundation.

---

## Product Requirements

### Core Features (MVP)

#### Feature 1: Express Backend Foundation

**Description**: Provide the common backend application structure and shared infrastructure that all modules use.

**User Story**: As a backend developer, I want a consistent Express foundation so that new modules can be added without duplicating routing, validation, error handling, and database patterns.

**Acceptance Criteria**:

- [ ] Express app and server entry points exist.
- [ ] Global routes mount under `/api`.
- [ ] Health check endpoint exists at `GET /api/health`.
- [ ] Environment configuration is centralized.
- [ ] MySQL connection configuration supports XAMPP locally and AWS RDS MySQL later.
- [ ] Standard response helper exists.
- [ ] Central `AppError` and `errorHandler` exist.
- [ ] Shared validation middleware exists.
- [ ] Authentication and authorization middleware exist.
- [ ] Basic safe logging convention exists.

#### Feature 2: Module-Based Layered Architecture

**Description**: Organize backend code by business module and separate each module into route, controller, service, repository, validator, and constants layers.

**User Story**: As a backend developer, I want each module to isolate its routing, business logic, data access, and validation so that changes in one module do not unintentionally affect other modules.

**Acceptance Criteria**:

- [ ] `modules/auth` follows the route/controller/service/repository/validator/constants pattern.
- [ ] Shared behavior lives outside feature modules under `config`, `middlewares`, `shared`, and `routes`.
- [ ] Database access happens through repository files.
- [ ] Business rules live in service files.
- [ ] Controllers stay thin and delegate business logic to services.
- [ ] New modules can follow the same folder pattern.

#### Feature 3: Admin-Created User Accounts

**Description**: Admin creates a login account for an existing employee.

**User Story**: As an admin, I want to create a user account for an employee so that the employee can sign in to the asset management system.

**Acceptance Criteria**:

- [ ] Only `ADMIN` can create employee user accounts.
- [ ] Account login identifier is the employee email.
- [ ] Created employee accounts receive role `USER`.
- [ ] Initial password uses the shared default password from environment configuration.
- [ ] Stored password is hashed.
- [ ] New accounts start with `must_change_password = true`.
- [ ] Duplicate accounts for the same employee or email are rejected.
- [ ] `USER` accounts must be linked to an employee by business rule.

#### Feature 4: Email Login And JWT Access Token

**Description**: Users log in with email and password and receive a JWT access token.

**User Story**: As an employee user, I want to log in with my company email and password so that I can access the system.

**Acceptance Criteria**:

- [ ] `ADMIN` and `USER` use the same login endpoint.
- [ ] Login validates email format, password, active status, and password hash.
- [ ] Successful login returns an access token and user context.
- [ ] JWT payload includes only `userId`, `role`, and `email`.
- [ ] Login response includes `mustChangePassword`.
- [ ] Inactive accounts cannot log in.
- [ ] Invalid credentials return a controlled error response.

#### Feature 5: First-Login Password Change

**Description**: Users with the default initial password must change password before using normal protected APIs.

**User Story**: As a new employee user, I want to change my initial password after first login so that my account is no longer protected by the shared default password.

**Acceptance Criteria**:

- [ ] User provides current password, new password, and confirmation.
- [ ] New password and confirmation must match.
- [ ] New password is hashed before storage.
- [ ] On success, `must_change_password` becomes `false`.
- [ ] While `mustChangePassword = true`, backend allows only `GET /api/auth/me`, `PUT /api/auth/change-password`, and `POST /api/auth/logout`.
- [ ] Normal protected APIs return `AUTH_PASSWORD_CHANGE_REQUIRED` while password change is required.

#### Feature 6: User Forgot Password By Email OTP

**Description**: `USER` accounts can reset password through an email OTP flow.

**User Story**: As an employee user, I want to reset my password with an OTP sent to email so that I can regain access if I forget my password.

**Acceptance Criteria**:

- [ ] Forgot-password applies only to `USER` accounts.
- [ ] Admin accounts do not use forgot-password OTP in the MVP.
- [ ] Forgot-password response does not reveal whether an email exists.
- [ ] OTP is stored as a hash when feasible.
- [ ] OTP expires after a configured duration.
- [ ] OTP has a `verified_at` state after successful verification.
- [ ] Password reset requires a verified, unused, and unexpired OTP.
- [ ] OTP is marked used after successful reset.
- [ ] Raw OTP is never logged.

#### Feature 7: Logout

**Description**: Frontend can call logout and remove its stored JWT token.

**User Story**: As a user, I want to log out so that the browser no longer keeps me signed in.

**Acceptance Criteria**:

- [ ] `POST /api/auth/logout` returns a successful response.
- [ ] Backend may log the logout event using safe metadata.
- [ ] Frontend removes the stored access token.
- [ ] Logout does not revoke already issued access tokens because token blacklist and refresh tokens are out of scope.

### Future Scope (Post-MVP)

1. Refresh tokens and token rotation.
2. Token blacklist or session revocation.
3. Multi-device session management.
4. Self-service admin password recovery.
5. Multi-factor authentication.
6. Enterprise audit logging.
7. Rate limiting and stronger abuse controls for login and OTP endpoints.
8. OpenAPI document generation and automated contract tests.

### Out of Scope

- Asset, department, employee, maintenance, inventory, and report business modules.
- Full user-management module beyond account creation and account status update.
- Refresh token.
- Token blacklist or session revocation.
- Multi-device session management.
- Self-service forgot password for admin accounts.
- MFA.
- Enterprise audit logging.
- Production-grade account recovery workflow for fixed/system-managed admin accounts.

### User Flows

#### Admin Creates Employee User Account

1. Admin sends `POST /api/auth/users` with `employeeId`.
2. Backend authenticates JWT.
3. Backend verifies role `ADMIN`.
4. Backend finds employee by `employeeId`.
5. Backend rejects duplicate account for the employee or email.
6. Backend hashes `DEFAULT_USER_PASSWORD`.
7. Backend creates `USER` with `must_change_password = true`.
8. Backend returns created user context without password fields.

#### Login With First-Login Password Change

1. User sends email and password to `POST /api/auth/login`.
2. Backend validates credentials and account status.
3. Backend returns access token, user context, and `mustChangePassword`.
4. If `mustChangePassword = true`, frontend navigates to change-password flow.
5. Backend blocks normal protected APIs until password is changed.
6. User calls `PUT /api/auth/change-password`.
7. Backend validates current password and stores the new password hash.
8. Backend sets `must_change_password = false`.

#### Forgot Password By OTP

1. User submits email to `POST /api/auth/forgot-password`.
2. Backend returns a non-enumerating success response.
3. If the account is an eligible `USER`, backend creates and stores a hashed OTP with expiry.
4. Backend sends the raw OTP by email.
5. User submits email and OTP to `POST /api/auth/verify-forgot-password-otp`.
6. Backend marks the OTP `verified_at`.
7. User submits email, OTP, new password, and confirmation to `POST /api/auth/reset-password`.
8. Backend requires a verified, unused, and unexpired OTP.
9. Backend stores the new password hash and marks OTP `used_at`.

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Runtime | Node.js | Fits the chosen project stack and Express backend. |
| Backend framework | Express | Lightweight and appropriate for an internship MVP. |
| Database | MySQL | Matches the project decision: XAMPP locally, AWS RDS MySQL in production. |
| Database access | Repository layer over MySQL client or query builder | Keeps SQL/database logic isolated from controllers and services. |
| Authentication | JWT access token | Simple MVP-compatible stateless auth. |
| Password hashing | bcrypt or equivalent | Standard password hashing approach for Node.js. |
| Email | SMTP-compatible mail configuration | Supports OTP delivery without locking the MVP to a specific provider. |
| Validation | Shared `validateRequest` middleware with schema validators | Keeps request validation consistent. |
| Logging | Console/winston/pino-compatible structured logging | Supports safe event logging without overbuilding observability. |
| Local database | XAMPP MySQL | Matches local development preference. |
| Production database | AWS RDS MySQL | Matches deployment requirement and keeps local/prod database compatible. |

### Architecture Pattern

The backend uses a module-based and layered architecture:

- `route`: declares endpoints and attaches middleware.
- `controller`: reads request data, calls services, and returns standard responses.
- `service`: owns business rules and orchestration.
- `repository`: owns database access.
- `validator`: validates request payloads.
- `constants`: stores module-specific constants.

Shared backend behavior lives outside modules:

- `config`: environment, database, JWT, and mail configuration.
- `middlewares`: authentication, authorization, validation, and error handling.
- `shared`: response helpers, error classes, constants, and utilities.
- `routes`: global route registration.

### Request Handling Pattern

```text
HTTP Request
  -> Express route
  -> validateRequest
  -> authenticate, if protected
  -> password-change-required guard, if normal protected API
  -> authorize, if role-restricted
  -> controller
  -> service
  -> repository
  -> MySQL
  -> standard API response or AppError
```

### Protected Endpoint Rules

- Public endpoints:
  - `GET /api/health`
  - `POST /api/auth/login`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/verify-forgot-password-otp`
  - `POST /api/auth/reset-password`
- Authenticated endpoints allowed while `mustChangePassword = true`:
  - `GET /api/auth/me`
  - `PUT /api/auth/change-password`
  - `POST /api/auth/logout`
- Admin-only endpoints:
  - `POST /api/auth/users`
  - `PATCH /api/auth/users/:id/status`

---

## System Maps

### Backend Scope Diagram

```text
Backend Foundation And Auth Scope
  |
  +-- Express application foundation
  |     +-- app/app.js
  |     +-- app/server.js
  |     +-- routes/index.js
  |
  +-- Shared configuration
  |     +-- env.js
  |     +-- database.js
  |     +-- jwt.js
  |     +-- mail.js
  |
  +-- Shared middleware
  |     +-- authenticate
  |     +-- authorize
  |     +-- validateRequest
  |     +-- errorHandler
  |     +-- password-change-required guard
  |
  +-- Shared utilities and contracts
  |     +-- apiResponse
  |     +-- AppError and errorCodes
  |     +-- password.util
  |     +-- token.util
  |     +-- otp.util
  |     +-- date.util
  |
  +-- Auth module
  |     +-- auth.route
  |     +-- auth.controller
  |     +-- auth.service
  |     +-- auth.repository
  |     +-- auth.validator
  |     +-- auth.constants
  |
  +-- Auth-related database tables
        +-- employees (minimal auth linkage only)
        +-- users
        +-- password_reset_otps
```

### Data Model Relations

```text
employees (1) ---- (0..1) users
users (1) -------- (0..N) password_reset_otps
```

### User Flow Diagram: First Login

```text
[Login]
  -> [Credentials valid?]
    -> no: [AUTH_INVALID_CREDENTIALS]
    -> yes: [Return JWT + mustChangePassword]
      -> mustChangePassword true: [Allow only me/change-password/logout]
      -> [Change password]
      -> [must_change_password = false]
      -> [Normal protected APIs allowed]
```

### User Flow Diagram: Forgot Password

```text
[Submit email]
  -> [Return generic success]
  -> [Eligible USER?]
    -> no: [No account existence leak]
    -> yes: [Create hashed OTP + expiry]
      -> [Send OTP email]
      -> [Verify OTP]
      -> [Mark verified_at]
      -> [Reset password with verified OTP]
      -> [Mark used_at]
```

### Minimal Auth Screen Contracts

This spec does not define frontend visual design. Frontend members need these screens or flows:

- Login screen.
- First-login change password screen.
- Forgot-password email screen.
- OTP verification screen.
- Reset password screen.
- Admin create user account action from an employee record.
- Admin activate/deactivate user account action.

---

## Data Models

### `employees`

The `employees` table stores business employee information, not login credentials.

```typescript
interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentId: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- Employee email is the source for the user login email.
- An employee may exist without a user account.
- A `USER` account must link to an employee by business rule.

### `users`

The `users` table stores login accounts.

```typescript
type UserRole = "ADMIN" | "USER";

interface User {
  id: number;
  employeeId: number | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- `email` is unique.
- `employee_id` is nullable because a fixed/system-managed `ADMIN` may not link to an employee.
- `employee_id` is unique for employee users so one employee cannot have multiple login accounts.
- `role` is `ADMIN` or `USER`.
- `USER` accounts must link to an employee by business rule.
- `ADMIN` can be a fixed/system-managed account and does not have to depend on an employee record.
- Passwords must never be returned by API responses.

### `password_reset_otps`

The `password_reset_otps` table stores forgot-password OTP state.

```typescript
interface PasswordResetOtp {
  id: number;
  userId: number;
  otpCodeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  verifiedAt: Date | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- Store OTP as a hash when feasible.
- OTP expires after a short configured duration.
- OTP is marked verified only after successful OTP verification.
- OTP is invalid after use.
- `attempt_count` increases when a user submits an invalid OTP.
- Only a verified, unused, and unexpired OTP can reset a password.
- Older active OTPs for the same user should be invalidated when a new successful reset happens.

---

## API Endpoints

### Standard Response Format

Successful responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errorCode": "AUTH_INVALID_CREDENTIALS"
}
```

### Endpoint Overview

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/health` | Health check | Public |
| POST | `/api/auth/login` | Login with email and password | Public |
| POST | `/api/auth/logout` | Logout event and frontend token removal | Bearer token |
| GET | `/api/auth/me` | Read current user context | Bearer token |
| PUT | `/api/auth/change-password` | Change current user's password | Bearer token |
| POST | `/api/auth/forgot-password` | Start user forgot-password flow | Public |
| POST | `/api/auth/verify-forgot-password-otp` | Verify forgot-password OTP | Public |
| POST | `/api/auth/reset-password` | Reset password after verified OTP | Public |
| POST | `/api/auth/users` | Admin creates employee user account | ADMIN |
| PATCH | `/api/auth/users/:id/status` | Admin activates/deactivates user account | ADMIN |

### Authentication Header

```text
Authorization: Bearer <accessToken>
```

### `GET /api/health`

Response:

```json
{
  "success": true,
  "message": "OK"
}
```

### `POST /api/auth/login`

Request:

```json
{
  "email": "employee@company.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": 1,
      "email": "employee@company.com",
      "role": "USER",
      "employeeId": 12,
      "mustChangePassword": true,
      "isActive": true
    }
  }
}
```

### `POST /api/auth/logout`

Request:

```json
{}
```

Response:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### `GET /api/auth/me`

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "employee@company.com",
    "role": "USER",
    "employeeId": 12,
    "mustChangePassword": false,
    "isActive": true
  }
}
```

### `PUT /api/auth/change-password`

Request:

```json
{
  "currentPassword": "123456",
  "newPassword": "NewStrongPassword123",
  "confirmNewPassword": "NewStrongPassword123"
}
```

Response:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### `POST /api/auth/forgot-password`

Request:

```json
{
  "email": "employee@company.com"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP has been sent if the account is eligible"
}
```

### `POST /api/auth/verify-forgot-password-otp`

Request:

```json
{
  "email": "employee@company.com",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true
  }
}
```

### `POST /api/auth/reset-password`

Request:

```json
{
  "email": "employee@company.com",
  "otp": "123456",
  "newPassword": "NewStrongPassword123",
  "confirmNewPassword": "NewStrongPassword123"
}
```

Response:

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### `POST /api/auth/users`

Request:

```json
{
  "employeeId": 12
}
```

Response:

```json
{
  "success": true,
  "message": "User account created successfully",
  "data": {
    "id": 15,
    "employeeId": 12,
    "email": "employee@company.com",
    "role": "USER",
    "mustChangePassword": true,
    "isActive": true
  }
}
```

### `PATCH /api/auth/users/:id/status`

Request:

```json
{
  "isActive": false
}
```

Response:

```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

### Error Codes

| Code | Meaning |
| --- | --- |
| `AUTH_INVALID_CREDENTIALS` | Email or password is incorrect. |
| `AUTH_UNAUTHORIZED` | Missing, invalid, or expired authentication token. |
| `AUTH_FORBIDDEN` | Authenticated user does not have the required role. |
| `AUTH_ACCOUNT_INACTIVE` | Account is disabled. |
| `AUTH_PASSWORD_MISMATCH` | New password and confirmation do not match, or current password is wrong where applicable. |
| `AUTH_INVALID_OTP` | OTP is missing, wrong, or not valid for the account. |
| `AUTH_OTP_EXPIRED` | OTP has expired. |
| `AUTH_OTP_NOT_VERIFIED` | Password reset attempted before OTP verification. |
| `AUTH_PASSWORD_CHANGE_REQUIRED` | User must change password before using normal protected APIs. |
| `AUTH_USER_ALREADY_EXISTS` | User account already exists for the employee or email. |
| `AUTH_USER_NOT_FOUND` | User was not found where explicit lookup is allowed. |
| `VALIDATION_ERROR` | Request payload failed validation. |
| `INTERNAL_SERVER_ERROR` | Unexpected backend error. |

---

## Authentication And Authorization

### Roles

- `ADMIN`: Can log in, create employee user accounts, and update account status.
- `USER`: Can log in, change own password, use forgot-password OTP, and call normal protected APIs after first-login password change.

### JWT Strategy

- Use access tokens only for MVP.
- JWT payload includes only:
  - `userId`
  - `role`
  - `email`
- Access token expiry is configured by `JWT_EXPIRES_IN`.
- Refresh tokens, token blacklist, and multi-device session management are out of scope.

### Password-Change-Required Guard

The backend must enforce first-login password change, not only the frontend.

When `mustChangePassword = true`, authenticated users may call only:

- `GET /api/auth/me`
- `PUT /api/auth/change-password`
- `POST /api/auth/logout`

All other normal protected APIs must return:

```json
{
  "success": false,
  "message": "Password change required",
  "errorCode": "AUTH_PASSWORD_CHANGE_REQUIRED"
}
```

---

## Security Requirements

### Password Security

- Never store plain text passwords.
- Store only `password_hash`.
- Use `bcrypt` or an equivalent password hashing library.
- Hash default, changed, and reset passwords before database updates.
- Never log passwords.
- Never return passwords in API responses.

### OTP Security

- OTP expires after `OTP_EXPIRES_MINUTES`.
- OTP has a verified state after the verify endpoint succeeds.
- OTP is invalid after use.
- Password reset requires a verified, unused, and unexpired OTP.
- OTP raw value must not be logged.
- Forgot-password response must not reveal account existence.
- Basic resend and failed-attempt limits should be considered for MVP hardening.

### Input Validation

All auth endpoints pass through `validateRequest`.

Validate:

- Email format.
- Password rule.
- Confirm password match.
- `employeeId` when admin creates an account.
- `isActive` boolean when admin updates account status.

### Logging Rules

Recommended log levels:

- `info`: login success, logout, account creation, OTP sent, password reset success.
- `warn`: login failure, invalid OTP, forbidden access, invalid token.
- `error`: database errors, mail errors, unexpected server errors.

Do not log:

- Raw password.
- Raw OTP.
- Full JWT token.
- Unnecessary sensitive data.

Safe auth event metadata:

- `userId`
- `email`
- `role`
- `action`
- `timestamp`
- `status`

---

## Observability And Operations

This scope requires lightweight foundation observability, not a full enterprise monitoring stack. The goal is to make local debugging, demo checks, and AWS deployment checks practical for the Person 1 backend.

### Request Observability

- [ ] Add a request ID to each incoming request.
- [ ] Use `X-Request-Id` when the client provides it.
- [ ] Generate a request ID when the client does not provide one.
- [ ] Include request ID in request logs.
- [ ] Include request ID in controlled error responses when useful for debugging.
- [ ] Log request method, path, status code, duration, and safe authenticated user metadata.

### Startup And Readiness

- [ ] Log server startup success with port and environment.
- [ ] Log database connection success or failure during startup.
- [ ] Keep `GET /api/health` as the basic operational readiness check.
- [ ] Ensure missing critical environment variables fail clearly during startup.

### Auth Operation Events

- [ ] Log login success and failure.
- [ ] Log logout.
- [ ] Log admin-created user account.
- [ ] Log user status change.
- [ ] Log password change success.
- [ ] Log forgot-password OTP requested.
- [ ] Log OTP verification success or failure.
- [ ] Log password reset success.
- [ ] Log password-change-required API rejection.

### Mail And OTP Operations

- [ ] Log OTP email send success or failure with safe metadata only.
- [ ] Never log raw OTP values.
- [ ] Never log SMTP credentials or mail secrets.
- [ ] Surface mail send failures as controlled backend errors.

### Out Of Scope

- Distributed tracing.
- Metrics dashboard.
- Alerting system.
- Centralized log aggregation.
- Enterprise audit log storage.

---

## File Structure

```text
backend/
  src/
    app/
      app.js
      server.js

    config/
      env.js
      database.js
      jwt.js
      mail.js

    modules/
      auth/
        auth.route.js
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validator.js
        auth.constants.js

      users/
        user.route.js
        user.controller.js
        user.service.js
        user.repository.js
        user.validator.js

      employees/
        employee.route.js
        employee.controller.js
        employee.service.js
        employee.repository.js
        employee.validator.js

    middlewares/
      authenticate.js
      authorize.js
      validateRequest.js
      errorHandler.js

    shared/
      response/
        apiResponse.js
      errors/
        AppError.js
        errorCodes.js
      utils/
        password.util.js
        token.util.js
        otp.util.js
        date.util.js
      constants/
        roles.js
        authStatus.js

    routes/
      index.js

    tests/
      setup.js
      helpers/

  package.json
  .env.example
```

For Person 1, the main deliverables are:

- `auth`
- `config`
- `middlewares`
- `shared`
- `routes/index.js`
- `app/app.js`
- `app/server.js`

`users` and `employees` may exist as minimal placeholders only when needed to support auth linkage.

---

## Environment Variables

`.env.example` must document:

| Variable | Description | Required |
| --- | --- | --- |
| `PORT` | API server port. | Yes |
| `NODE_ENV` | Runtime environment. | Yes |
| `DB_HOST` | MySQL host. | Yes |
| `DB_PORT` | MySQL port. | Yes |
| `DB_USER` | MySQL username. | Yes |
| `DB_PASSWORD` | MySQL password. | Yes |
| `DB_NAME` | MySQL database name. | Yes |
| `JWT_SECRET` | Secret used to sign JWT access tokens. | Yes |
| `JWT_EXPIRES_IN` | Access token expiry duration. | Yes |
| `DEFAULT_USER_PASSWORD` | Shared initial password for admin-created employee accounts. | Yes |
| `OTP_EXPIRES_MINUTES` | Forgot-password OTP expiration window. | Yes |
| `MAIL_HOST` | SMTP host. | Yes |
| `MAIL_PORT` | SMTP port. | Yes |
| `MAIL_USER` | SMTP username. | Yes |
| `MAIL_PASSWORD` | SMTP password. | Yes |
| `MAIL_FROM` | Sender email address. | Yes |

Secrets must not be committed in real `.env` files.

---

## Testing Plan

### Foundation Tests

- [ ] Server starts.
- [ ] `GET /api/health` returns the expected response.
- [ ] MySQL connection works.
- [ ] Global route registration works under `/api`.
- [ ] `errorHandler` returns standard errors.
- [ ] `validateRequest` rejects invalid input.
- [ ] `authenticate` rejects missing or invalid JWT.
- [ ] `authorize` rejects insufficient roles.
- [ ] Request ID is available in logs for handled requests.
- [ ] Startup logs clearly show server and database connection status.

### Auth Tests

- [ ] `ADMIN` can log in.
- [ ] `ADMIN` can create a `USER` account from an employee.
- [ ] New `USER` account has `mustChangePassword = true`.
- [ ] `USER` can log in with default password.
- [ ] Login response contains `mustChangePassword`.
- [ ] Backend blocks normal protected APIs while `mustChangePassword = true`.
- [ ] `USER` can change password.
- [ ] `mustChangePassword` becomes `false` after password change.
- [ ] `USER` can log in with the new password.
- [ ] `USER` can start forgot-password flow.
- [ ] Valid OTP can be verified.
- [ ] Password reset requires a verified OTP.
- [ ] Invalid, expired, or used OTP is rejected.
- [ ] `USER` can log out.
- [ ] Inactive account cannot log in.
- [ ] `USER` cannot call admin-only endpoints.

### Minimum Test Data

- One fixed `ADMIN` account.
- One employee without a user account.
- One employee with a `USER` account.
- One `USER` with `mustChangePassword = true`.
- One active `USER` with normal login.

### Handoff Validation

- [ ] Frontend can log in and read `accessToken`.
- [ ] Frontend can read `mustChangePassword`.
- [ ] Frontend can send `Authorization: Bearer <accessToken>`.
- [ ] Frontend handles important auth error codes.
- [ ] Frontend follows forgot-password flow: `forgot-password -> verify-forgot-password-otp -> reset-password`.
- [ ] Backend members can create a new module using the same folder and layer pattern.

---

## Development Phases

### Phase 1: Backend Foundation

- [ ] Create backend project structure.
- [ ] Configure Express app and server entry points.
- [ ] Add centralized environment loader.
- [ ] Add MySQL database connection configuration.
- [ ] Add global route registration under `/api`.
- [ ] Add `GET /api/health`.
- [ ] Add standard response helper.
- [ ] Add `AppError`, error codes, and `errorHandler`.
- [ ] Add validation middleware pattern.
- [ ] Add basic logging convention.
- [ ] Add request ID and lightweight operational logging.

### Phase 2: Auth Data And Utilities

- [ ] Create or document `employees`, `users`, and `password_reset_otps` schemas.
- [ ] Add role and auth-status constants.
- [ ] Add password hashing utility.
- [ ] Add JWT token utility.
- [ ] Add OTP generation/hash/expiry utility.
- [ ] Add date utility for expiry checks.

### Phase 3: Auth Core APIs

- [ ] Implement `POST /api/auth/login`.
- [ ] Implement `GET /api/auth/me`.
- [ ] Implement `PUT /api/auth/change-password`.
- [ ] Implement `POST /api/auth/logout`.
- [ ] Implement `POST /api/auth/users`.
- [ ] Implement `PATCH /api/auth/users/:id/status`.

### Phase 4: Forgot Password OTP

- [ ] Implement `POST /api/auth/forgot-password`.
- [ ] Implement OTP email sending.
- [ ] Implement `POST /api/auth/verify-forgot-password-otp`.
- [ ] Implement `POST /api/auth/reset-password`.
- [ ] Enforce verified, unused, unexpired OTP rule.
- [ ] Ensure forgot-password response does not reveal account existence.

### Phase 5: Middleware Enforcement

- [ ] Implement `authenticate`.
- [ ] Implement `authorize`.
- [ ] Enforce admin-only endpoints.
- [ ] Enforce password-change-required guard.
- [ ] Ensure allowed endpoints remain usable while `mustChangePassword = true`.

### Phase 6: Testing And Handoff

- [ ] Add foundation tests.
- [ ] Add auth route and service tests.
- [ ] Add OTP edge-case tests.
- [ ] Prepare minimum seed/test data notes.
- [ ] Document frontend auth handoff.
- [ ] Document backend module integration guide.

---

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| OTP email adds more scope than basic auth. | Keep OTP flow simple and avoid admin OTP in MVP. |
| Logout cannot revoke JWT without blacklist/session storage. | Document the limitation and keep the API stable for later enhancement. |
| Shared default password is weaker than per-user initial passwords. | Force `mustChangePassword` on first login and never reuse the default for forgot-password reset. |
| Foundation can become over-engineered. | Keep module-based and layered architecture, but avoid full enterprise use-case/entity abstraction in MVP. |
| Email sending can fail in local development. | Keep mail configuration explicit and log safe failure metadata. |
| Frontend may rely only on UI blocking for first-login password change. | Backend must enforce `AUTH_PASSWORD_CHANGE_REQUIRED` for normal protected APIs. |

---

## Open Questions

- [ ] Confirm exact password rule, such as minimum length and required character classes.
- [ ] Confirm OTP expiration duration for `OTP_EXPIRES_MINUTES`.
- [ ] Confirm failed OTP attempt limit and resend limit for MVP hardening.
- [ ] Confirm mail provider or SMTP service for local demo and AWS deployment.
- [ ] Confirm whether MySQL access will use raw SQL, `mysql2`, Sequelize, Prisma, or another query layer. Do not run Prisma CLI unless the user explicitly handles it.
- [ ] Confirm production backend hosting choice: EC2, Elastic Beanstalk, or another AWS service.

---

## References

- Source design document: `docs/plans/2026-06-02-backend-foundation-auth-design.md`
- Implementation plan: `docs/plans/2026-06-02-backend-foundation-auth-implementation-plan.md`
- Continuity ledger: `CONTINUITY.md`
