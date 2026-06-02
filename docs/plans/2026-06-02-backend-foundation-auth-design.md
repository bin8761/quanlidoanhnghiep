# Technical Design Document: Backend Foundation And Auth

## 1. Overview

This document defines the Person 1 scope for the Enterprise Asset Management MVP.

Person 1 owns the shared backend foundation and the first business module: authentication. The goal is to create a stable Express backend foundation that other backend members can extend without changing shared behavior, while delivering a complete auth module for login, account provisioning, first-login password change, logout, and user forgot-password by email OTP.

This is a design document only. It does not include implementation code.

## 2. Scope

### 2.1 In Scope

- Express backend foundation.
- Module-based and layered backend architecture.
- Environment configuration.
- MySQL connection setup for local XAMPP and later AWS RDS MySQL.
- Shared route registration pattern.
- Shared response format.
- Shared validation pattern.
- Shared error handling.
- Shared authentication and authorization middleware.
- Shared logging conventions.
- Auth module.
- Admin-created user accounts.
- Email-based login.
- JWT access token authentication.
- Logout endpoint.
- First-login password change requirement.
- User forgot-password flow with email OTP.
- Fixed/system-managed admin account recovery outside the normal UI flow.

### 2.2 Out Of Scope

- Asset, department, employee, maintenance, inventory, and report business modules.
- Full user-management module beyond account creation and account status update.
- Refresh token.
- Token blacklist/session revocation.
- Multi-device session management.
- Self-service forgot password for admin accounts.
- MFA.
- Enterprise audit logging.

## 3. Architecture

The backend uses a module-based and layered architecture.

The system is divided by module, such as `auth`, `users`, `employees`, and later `assets`, `maintenance`, and `inventory`. Inside each module, responsibilities are separated into layers:

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

This structure keeps changes localized. Database query changes stay in repositories. Business rule changes stay in services. Request validation changes stay in validators. Other modules can follow the same pattern without changing the foundation.

## 4. Backend Folder Structure

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

For Person 1, `auth`, `config`, `middlewares`, `shared`, `routes/index.js`, `app/app.js`, and `app/server.js` are the main deliverables. `users` and `employees` can exist as minimal placeholders only when needed to support auth linkage.

## 5. Auth Flows

### 5.1 Admin Creates User Account

Admin creates a user account for an employee.

Rules:

- Only `ADMIN` can create a user account.
- The account login identifier is the employee email.
- A new employee user receives role `USER`.
- The initial password uses the shared default password for first access.
- The stored password is always hashed.
- The new account starts with `must_change_password = true`.
- Duplicate accounts for the same email or employee are rejected.

### 5.2 Login

Users log in with email and password.

Rules:

- Both `ADMIN` and `USER` use the login endpoint.
- The backend validates email, password, account status, and password hash.
- A successful login returns a JWT access token and user context.
- The response includes `mustChangePassword`.
- If `mustChangePassword = true`, frontend allows login but blocks normal app usage until password is changed.

### 5.3 First Login Change Password

Users who log in for the first time with the default password must change it.

Rules:

- User must provide current password.
- New password and confirmation must match.
- Password is hashed before storage.
- On success, `must_change_password` becomes `false`.

### 5.4 Forgot Password By OTP For User

The forgot-password flow applies to `USER` accounts only.

Flow:

- User submits email.
- Backend creates an OTP with an expiry time.
- Backend sends OTP by email.
- User verifies OTP.
- User resets password with the valid OTP.
- OTP is marked used after a successful reset.

Rules:

- Admin accounts do not use this flow in the MVP.
- The forgot-password response must not reveal whether an email exists.
- OTP must expire.
- OTP must not be reusable.

### 5.5 Logout

The MVP uses JWT access tokens only.

Rules:

- Frontend calls `POST /api/auth/logout`.
- Frontend removes the stored token.
- Backend returns a successful response and may log the logout event.
- Since refresh tokens and token blacklist are out of scope, logout does not revoke already issued access tokens.

### 5.6 Admin Recovery

Admin account recovery is handled outside the normal UI in the MVP.

Rules:

- Admin is treated as a fixed or system-managed account.
- If admin access is lost, recovery is handled manually at the system or database level.
- Admin forgot-password OTP is out of scope.

## 6. Auth Database Design

### 6.1 `employees`

The `employees` table stores business employee information, not login credentials.

Auth-related fields:

- `id`
- `employee_code`
- `full_name`
- `email`
- `department_id`
- `status`
- `created_at`
- `updated_at`

The employee email is the source for the user login email.

### 6.2 `users`

The `users` table stores login accounts.

Fields:

- `id`
- `employee_id`
- `email`
- `password_hash`
- `role`
- `is_active`
- `must_change_password`
- `last_login_at`
- `created_at`
- `updated_at`

Rules:

- `email` is unique.
- `employee_id` is unique for employee users.
- `role` is `ADMIN` or `USER`.
- `USER` accounts should link to an employee.
- `ADMIN` can be a fixed/system-managed account and does not have to depend on an employee record.

### 6.3 `password_reset_otps`

The `password_reset_otps` table stores forgot-password OTP state.

Fields:

- `id`
- `user_id`
- `otp_code_hash`
- `expires_at`
- `used_at`
- `attempt_count`
- `created_at`

Rules:

- Store OTP as a hash when feasible.
- OTP expires after a short duration.
- OTP is invalid after use.
- Older active OTPs for the same user should be invalidated when a new successful reset happens.

## 7. Auth API Contract

### 7.1 Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-forgot-password-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/users`
- `PATCH /api/auth/users/:id/status`

### 7.2 Login

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

### 7.3 Logout

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

### 7.4 Me

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

### 7.5 Change Password

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

### 7.6 Forgot Password

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

### 7.7 Verify Forgot Password OTP

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
  "message": "OTP verified successfully"
}
```

### 7.8 Reset Password

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

### 7.9 Admin Creates User Account

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

### 7.10 Update User Status

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

### 7.11 Error Contract

All auth endpoints use this error shape:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errorCode": "AUTH_INVALID_CREDENTIALS"
}
```

Minimum auth error codes:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `AUTH_ACCOUNT_INACTIVE`
- `AUTH_PASSWORD_MISMATCH`
- `AUTH_INVALID_OTP`
- `AUTH_OTP_EXPIRED`
- `AUTH_USER_ALREADY_EXISTS`
- `AUTH_USER_NOT_FOUND`
- `VALIDATION_ERROR`
- `INTERNAL_SERVER_ERROR`

## 8. Security, Logging, And Error Handling

### 8.1 Password Security

- Never store plain text passwords.
- Store only `password_hash`.
- Use `bcrypt` or an equivalent password hashing library.
- Hash default, changed, and reset passwords before database updates.
- Never log passwords.
- Never return passwords in API responses.

### 8.2 JWT Strategy

- Use access tokens only for MVP.
- JWT payload should include only `userId`, `role`, and `email`.
- Access tokens must have a clear expiry.
- Refresh tokens, token blacklist, and multi-device session management are out of scope.

### 8.3 Authorization

- `authenticate` validates JWT.
- `authorize` validates role.
- Admin-only endpoints require `ADMIN`.
- Authenticated user endpoints require a valid token.
- Role checks should live in middleware, not inside controllers.

### 8.4 OTP Security

- OTP expires after a short duration.
- OTP is invalid after use.
- OTP raw value must not be logged.
- Forgot-password response must not reveal account existence.
- Basic resend and failed-attempt limits should be considered for the MVP.

### 8.5 Input Validation

All auth endpoints pass through `validateRequest`.

Validate:

- Email format.
- Password rule.
- Confirm password match.
- `employeeId` when admin creates an account.
- `isActive` boolean when admin updates account status.

### 8.6 Error Handling

The foundation should provide:

- `AppError`
- `errorHandler`
- standard `statusCode`
- standard `errorCode`
- controlled client messages
- backend-only stack traces

### 8.7 Logging

Recommended log levels:

- `info`: login success, logout, account creation, OTP sent, password reset success.
- `warn`: login failure, invalid OTP, forbidden access, invalid token.
- `error`: database errors, mail errors, unexpected server errors.

Do not log:

- raw password
- raw OTP
- full JWT token
- unnecessary sensitive data

Auth event logs should only include safe metadata such as:

- `userId`
- `email`
- `role`
- `action`
- `timestamp`
- `status`

## 9. Testing And Handoff

### 9.1 Foundation Tests

Person 1 should verify:

- Server starts.
- Health check returns the expected response.
- MySQL connection works.
- Global route registration works under `/api`.
- `errorHandler` returns standard errors.
- `validateRequest` rejects invalid input.
- `authenticate` rejects missing or invalid JWT.
- `authorize` rejects insufficient roles.

### 9.2 Auth Tests

Person 1 should verify:

- `ADMIN` can log in.
- `ADMIN` can create a `USER` account from an employee.
- New `USER` account has `mustChangePassword = true`.
- `USER` can log in with default password.
- Login response contains `mustChangePassword`.
- `USER` can change password.
- `mustChangePassword` becomes `false` after password change.
- `USER` can log in with the new password.
- `USER` can start forgot-password flow.
- Valid OTP allows password reset.
- Invalid, expired, or used OTP is rejected.
- `USER` can log out.
- Inactive account cannot log in.
- `USER` cannot call admin-only endpoints.

### 9.3 Minimum Test Data

Person 1 should provide or document:

- One fixed `ADMIN` account.
- One employee without a user account.
- One employee with a `USER` account.
- One `USER` with `mustChangePassword = true`.
- One active `USER` with normal login.

### 9.4 Frontend Handoff

Frontend members need:

- Auth endpoint list.
- Login request and response shape.
- `mustChangePassword` behavior.
- JWT header format:

```text
Authorization: Bearer <accessToken>
```

- Important auth error codes.
- Forgot-password flow:

```text
forgot-password -> verify-forgot-password-otp -> reset-password
```

### 9.5 Backend Handoff

Backend members need:

- How to create a new module under `modules/`.
- How to mount module routes in `routes/index.js`.
- How to use `authenticate`.
- How to use `authorize`.
- How to use `validateRequest`.
- How to return standard responses.
- How to throw `AppError`.
- How to use the database connection and repository pattern.

## 10. Done Criteria

Person 1 is done when:

- Backend can run locally.
- MySQL/XAMPP connection works.
- Shared foundation is in place.
- Auth APIs work.
- Auth middleware works.
- Error and response format are consistent.
- Basic logging exists.
- The team has a short backend integration guide.
- Frontend can log in, read token, read `mustChangePassword`, and call protected APIs.

## 11. Risks And Mitigations

- OTP email adds more scope than basic auth.
  - Mitigation: keep OTP flow simple and avoid admin OTP in MVP.
- Logout cannot revoke JWT without blacklist/session storage.
  - Mitigation: document this explicitly and keep the API stable for later enhancement.
- Shared default password is weaker than per-user initial passwords.
  - Mitigation: force `mustChangePassword` on first login and never reuse the default for forgot-password reset.
- Foundation can become over-engineered.
  - Mitigation: keep the architecture module-based and layered, but avoid full enterprise use-case/entity abstraction in MVP.
