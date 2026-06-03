# Auth Seed Plan

This file documents the minimum local seed data required for the backend foundation and auth scope.

The assistant does not run any database or Prisma commands.
The user will create and import the real seed later after the Prisma schema, password utilities, and local database are ready.

## Goal

Prepare one fixed `ADMIN`, one employee without a user, one employee with a user, one first-login user, and one active user for local testing and demo flows.

## Recommended Seed Strategy

- Keep the fixed `ADMIN` account in `users` with `employeeId = null`.
- Create employee records first.
- Create user records after employees exist.
- Use placeholder password hashes in the plan until the project password utility is implemented.
- Reuse `DEFAULT_USER_PASSWORD` only for seeded first-login accounts that must change password.
- Do not store or commit raw passwords in SQL or seed files.

## Planned Records

### 1. Fixed ADMIN

Purpose:
Support admin login and admin-only account creation/status APIs.

Planned `users` record:

- `email`: `admin@company.local`
- `role`: `ADMIN`
- `employeeId`: `null`
- `isActive`: `true`
- `mustChangePassword`: `false`
- `passwordHash`: `ADMIN_PASSWORD_HASH_PLACEHOLDER`

Notes:

- This is the fixed/system-managed account mentioned in the design.
- Use a manually generated bcrypt hash when the real seed is written.

### 2. Employee Without User

Purpose:
Support `POST /api/auth/users` tests for creating a user from an existing employee.

Planned `employees` record:

- `employeeCode`: `EMP001`
- `fullName`: `No User Employee`
- `email`: `nouser.employee@company.local`
- `status`: `ACTIVE`

Planned linked `users` record:

- None.

### 3. Employee With User

Purpose:
Support duplicate-account protection and account status update tests.

Planned `employees` record:

- `employeeCode`: `EMP002`
- `fullName`: `Inactive User Employee`
- `email`: `inactive.employee@company.local`
- `status`: `ACTIVE`

Planned `users` record:

- `email`: `inactive.employee@company.local`
- `role`: `USER`
- `employeeId`: link to `EMP002`
- `isActive`: `false`
- `mustChangePassword`: `false`
- `passwordHash`: `USER_PASSWORD_HASH_PLACEHOLDER`

Notes:

- This record satisfies the generic "employee with a user" requirement without overlapping the first-login and active-user cases.

### 4. First-Login USER

Purpose:
Support login success with `mustChangePassword = true` and password-change-required guard tests.

Planned `employees` record:

- `employeeCode`: `EMP003`
- `fullName`: `First Login Employee`
- `email`: `firstlogin.employee@company.local`
- `status`: `ACTIVE`

Planned `users` record:

- `email`: `firstlogin.employee@company.local`
- `role`: `USER`
- `employeeId`: link to `EMP003`
- `isActive`: `true`
- `mustChangePassword`: `true`
- `passwordHash`: `DEFAULT_USER_PASSWORD_HASH_PLACEHOLDER`

Notes:

- This user should log in with the shared default password.
- After a successful password change, `mustChangePassword` should become `false`.

### 5. Active USER

Purpose:
Support normal login, `GET /api/auth/me`, forgot-password OTP, reset-password, and normal protected route tests.

Planned `employees` record:

- `employeeCode`: `EMP004`
- `fullName`: `Active User Employee`
- `email`: `active.employee@company.local`
- `status`: `ACTIVE`

Planned `users` record:

- `email`: `active.employee@company.local`
- `role`: `USER`
- `employeeId`: link to `EMP004`
- `isActive`: `true`
- `mustChangePassword`: `false`
- `passwordHash`: `ACTIVE_USER_PASSWORD_HASH_PLACEHOLDER`

## Planned Insert Order

1. Insert the employee records for `EMP001` to `EMP004`.
2. Insert the fixed `ADMIN` user with `employeeId = null`.
3. Insert the inactive `USER` linked to `EMP002`.
4. Insert the first-login `USER` linked to `EMP003`.
5. Insert the active `USER` linked to `EMP004`.

## Password Hash Preparation Plan

- Generate the admin hash from a private local password chosen by the user/team.
- Generate the first-login hash from `DEFAULT_USER_PASSWORD`.
- Generate the inactive-user and active-user hashes from private local test passwords.
- Keep raw passwords out of committed files.
- When the real seed script is created later, only commit hashes or reference environment-driven values where practical.

## Candidate Future Seed Outputs

One of these can be created later by the user/team:

- `backend/prisma/seed.js`
- `backend/database/seed-auth.sql`
- `backend/docs/local-seed-runbook.md`

## Manual Verification Targets

After the real seed is created and imported by the user:

- `ADMIN` can log in successfully.
- `nouser.employee@company.local` does not have a user account yet.
- `inactive.employee@company.local` cannot log in because `isActive = false`.
- `firstlogin.employee@company.local` can log in and receives `mustChangePassword = true`.
- `active.employee@company.local` can log in and use normal protected APIs.
