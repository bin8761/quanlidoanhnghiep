# Backend Foundation And Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the shared Express backend foundation and the `auth` module for the Enterprise Asset Management MVP.

**Architecture:** Use a module-based and layered backend. Shared foundation code lives under `backend/src/config`, `backend/src/middlewares`, `backend/src/shared`, `backend/src/routes`, and `backend/src/app`; auth logic lives under `backend/src/modules/auth` with route, controller, service, repository, validator, and constants layers.

**Tech Stack:** Node.js, Express, MySQL via `mysql2/promise`, JWT via `jsonwebtoken`, password hashing via `bcryptjs`, validation via `zod`, email via `nodemailer`, test runner via Jest and Supertest.

---

## Prerequisites

- The user runs all DB, migration, and server commands.
- The user does not use Prisma CLI for this project phase.
- Local MySQL should be available through XAMPP.
- The implementation should not touch business modules such as assets, departments, maintenance, inventory, or reports.
- Existing modified file `docs/plans/2026-06-02-enterprise-asset-management-design.md` should not be reverted or staged unless explicitly requested.

## Task 1: Scaffold Backend Package

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/app/app.js`
- Create: `backend/src/app/server.js`
- Create: `backend/src/routes/index.js`

**Step 1: Write the failing smoke test**

Create `backend/src/app/app.test.js`:

```js
const request = require('supertest');
const { createApp } = require('./app');

describe('app foundation', () => {
  it('returns health status', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Backend is healthy',
      data: { status: 'ok' },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd backend
npm test -- app.test.js
```

Expected: FAIL because backend package and app files do not exist yet.

**Step 3: Create package and minimal app**

Create `backend/package.json`:

```json
{
  "name": "enterprise-asset-management-backend",
  "version": "1.0.0",
  "private": true,
  "main": "src/app/server.js",
  "scripts": {
    "dev": "nodemon src/app/server.js",
    "start": "node src/app/server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.0",
    "nodemailer": "^6.9.14",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "supertest": "^7.0.0"
  }
}
```

Create `backend/.env.example`:

```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=enterprise_asset_management

JWT_SECRET=change_me
JWT_EXPIRES_IN=4h

DEFAULT_USER_PASSWORD=ChangeMe123
OTP_EXPIRES_MINUTES=10

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM="EAM System <no-reply@example.com>"
```

Create `backend/src/app/app.js`:

```js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('../routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api', routes);

  return app;
}

module.exports = { createApp };
```

Create `backend/src/routes/index.js`:

```js
const express = require('express');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is healthy',
    data: { status: 'ok' },
  });
});

module.exports = router;
```

Create `backend/src/app/server.js`:

```js
const { createApp } = require('./app');

const port = process.env.PORT || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd backend
npm install
npm test -- app.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/package.json backend/.env.example backend/src
git commit -m "feat: scaffold backend foundation"
```

## Task 2: Add Shared Response And Error Handling

**Files:**
- Create: `backend/src/shared/response/apiResponse.js`
- Create: `backend/src/shared/errors/AppError.js`
- Create: `backend/src/shared/errors/errorCodes.js`
- Create: `backend/src/middlewares/errorHandler.js`
- Modify: `backend/src/app/app.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/src/shared/errors/errorHandler.test.js`

**Step 1: Write the failing test**

```js
const request = require('supertest');
const { createApp } = require('../../app/app');
const { AppError } = require('./AppError');

describe('errorHandler', () => {
  it('returns standard error response', async () => {
    const app = createApp();
    app.get('/api/test-error', () => {
      throw new AppError('Forbidden', 403, 'AUTH_FORBIDDEN');
    });

    const response = await request(app).get('/api/test-error');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
      errorCode: 'AUTH_FORBIDDEN',
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd backend
npm test -- errorHandler.test.js
```

Expected: FAIL because shared error handling does not exist.

**Step 3: Implement shared helpers**

Create standard response helpers, `AppError`, error codes, and global `errorHandler`. Use the same response format from the design document.

**Step 4: Run tests**

Run:

```bash
cd backend
npm test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src
git commit -m "feat: add shared response and error handling"
```

## Task 3: Add Environment And Database Configuration

**Files:**
- Create: `backend/src/config/env.js`
- Create: `backend/src/config/database.js`
- Test: `backend/src/config/env.test.js`

**Step 1: Write the failing env test**

```js
describe('env config', () => {
  it('loads required defaults for test environment', () => {
    const { env } = require('./env');

    expect(env.port).toBeDefined();
    expect(env.jwtSecret).toBeDefined();
    expect(env.defaultUserPassword).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd backend
npm test -- env.test.js
```

Expected: FAIL because config files do not exist.

**Step 3: Implement config**

Implement `env.js` with dotenv-backed config and `database.js` with a `mysql2/promise` pool.

Do not run database commands automatically. The user should manually verify DB connection later.

**Step 4: Run tests**

Run:

```bash
cd backend
npm test -- env.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/config backend/.env.example
git commit -m "feat: add backend environment and database config"
```

## Task 4: Add Auth Database Schema SQL

**Files:**
- Create: `backend/database/schema.sql`
- Create: `backend/database/seed-admin.sql`
- Create: `backend/docs/database-setup.md`

**Step 1: Write schema notes before SQL**

Create `backend/docs/database-setup.md` explaining:

- User must run SQL manually in XAMPP/MySQL.
- Tables include `employees`, `users`, and `password_reset_otps`.
- `USER` accounts link to employees.
- `ADMIN` can be fixed/system-managed.

**Step 2: Create SQL schema**

Create `backend/database/schema.sql` with:

- `employees`
- `users`
- `password_reset_otps`
- unique indexes on `users.email` and `users.employee_id`
- role check where supported by MySQL version

**Step 3: Create admin seed SQL**

Create `backend/database/seed-admin.sql` with a documented placeholder hash. Do not hardcode a real plain password in SQL. Document how to generate the hash during implementation.

**Step 4: User-run verification**

Ask the user to run manually:

```bash
mysql -u root -p enterprise_asset_management < backend/database/schema.sql
```

Expected: tables are created.

**Step 5: Commit**

```bash
git add backend/database backend/docs/database-setup.md
git commit -m "feat: add auth database schema"
```

## Task 5: Add Validation Middleware

**Files:**
- Create: `backend/src/middlewares/validateRequest.js`
- Test: `backend/src/middlewares/validateRequest.test.js`

**Step 1: Write failing test**

Test that invalid request body returns `VALIDATION_ERROR`.

**Step 2: Run test**

Run:

```bash
cd backend
npm test -- validateRequest.test.js
```

Expected: FAIL.

**Step 3: Implement middleware**

Implement a Zod-backed `validateRequest(schema)` middleware that validates `body`, `params`, and `query` when provided.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/middlewares/validateRequest.js backend/src/middlewares/validateRequest.test.js
git commit -m "feat: add request validation middleware"
```

## Task 6: Add Authentication And Authorization Middleware

**Files:**
- Create: `backend/src/shared/constants/roles.js`
- Create: `backend/src/shared/utils/token.util.js`
- Create: `backend/src/middlewares/authenticate.js`
- Create: `backend/src/middlewares/authorize.js`
- Test: `backend/src/middlewares/authMiddleware.test.js`

**Step 1: Write failing middleware tests**

Test:

- missing token returns `AUTH_UNAUTHORIZED`
- invalid token returns `AUTH_UNAUTHORIZED`
- `USER` calling admin route returns `AUTH_FORBIDDEN`
- `ADMIN` can call admin route

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement token utility and middleware**

Use `jsonwebtoken`.

JWT payload:

```js
{
  userId,
  email,
  role
}
```

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/shared backend/src/middlewares
git commit -m "feat: add auth middleware"
```

## Task 7: Add Password And OTP Utilities

**Files:**
- Create: `backend/src/shared/utils/password.util.js`
- Create: `backend/src/shared/utils/otp.util.js`
- Test: `backend/src/shared/utils/password.util.test.js`
- Test: `backend/src/shared/utils/otp.util.test.js`

**Step 1: Write failing utility tests**

Test:

- password hash verifies valid password
- password hash rejects invalid password
- OTP generator returns a 6-digit code
- OTP hash comparison works

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement utilities**

Use `bcryptjs` for passwords and OTP hash comparison.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/shared/utils
git commit -m "feat: add password and otp utilities"
```

## Task 8: Add Auth Validators And Constants

**Files:**
- Create: `backend/src/modules/auth/auth.constants.js`
- Create: `backend/src/modules/auth/auth.validator.js`
- Test: `backend/src/modules/auth/auth.validator.test.js`

**Step 1: Write failing validation tests**

Test schemas for:

- login
- change password
- forgot password
- verify OTP
- reset password
- create user account
- update user status

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement validators**

Use Zod schemas with clear password and email requirements.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/auth
git commit -m "feat: add auth validators"
```

## Task 9: Add Auth Repository

**Files:**
- Create: `backend/src/modules/auth/auth.repository.js`
- Test: `backend/src/modules/auth/auth.repository.test.js`

**Step 1: Write repository tests with mocked DB**

Mock database pool and test repository methods:

- find user by email
- find user by id
- create user account
- update password
- update `must_change_password`
- create OTP
- mark OTP used
- update account status

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement repository**

Repository should only handle database access. No business rules.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.repository.js backend/src/modules/auth/auth.repository.test.js
git commit -m "feat: add auth repository"
```

## Task 10: Add Mail Configuration And OTP Mail Sender

**Files:**
- Create: `backend/src/config/mail.js`
- Create: `backend/src/shared/utils/mail.util.js`
- Test: `backend/src/shared/utils/mail.util.test.js`

**Step 1: Write failing mail test**

Mock nodemailer and verify that OTP email sends to the correct email without logging the raw OTP.

**Step 2: Run test**

Expected: FAIL.

**Step 3: Implement mail config and utility**

Use nodemailer with env-backed config.

**Step 4: Run test**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/config/mail.js backend/src/shared/utils/mail.util.js backend/src/shared/utils/mail.util.test.js
git commit -m "feat: add otp mail utility"
```

## Task 11: Add Auth Service

**Files:**
- Create: `backend/src/modules/auth/auth.service.js`
- Test: `backend/src/modules/auth/auth.service.test.js`

**Step 1: Write service tests**

Test:

- login success returns token and user context
- invalid credentials fail
- inactive account fails
- admin creates user account
- duplicate user account fails
- change password clears `must_change_password`
- forgot password creates OTP for active `USER`
- forgot password does not reveal unknown email
- reset password with valid OTP updates password and marks OTP used
- admin cannot use `USER` OTP flow

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement service**

Service owns business rules and coordinates repository, password utility, token utility, OTP utility, and mail utility.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.service.js backend/src/modules/auth/auth.service.test.js
git commit -m "feat: add auth service"
```

## Task 12: Add Auth Controller And Routes

**Files:**
- Create: `backend/src/modules/auth/auth.controller.js`
- Create: `backend/src/modules/auth/auth.route.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/src/modules/auth/auth.route.test.js`

**Step 1: Write route tests**

Use Supertest with mocked service methods.

Test:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-forgot-password-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/users`
- `PATCH /api/auth/users/:id/status`

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement controller and routes**

Controller should only call service and return standard responses.

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/auth backend/src/routes/index.js
git commit -m "feat: add auth api routes"
```

## Task 13: Add Logging Foundation

**Files:**
- Create: `backend/src/shared/utils/logger.js`
- Modify: `backend/src/middlewares/errorHandler.js`
- Modify: `backend/src/modules/auth/auth.service.js`
- Test: `backend/src/shared/utils/logger.test.js`

**Step 1: Write logging test**

Test logger accepts safe metadata and does not require sensitive values.

**Step 2: Run tests**

Expected: FAIL.

**Step 3: Implement logger**

Use a simple logger wrapper for MVP. Log `info`, `warn`, and `error`.

Never log:

- raw password
- raw OTP
- full JWT token

**Step 4: Run tests**

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/shared/utils/logger.js backend/src/middlewares/errorHandler.js backend/src/modules/auth/auth.service.js
git commit -m "feat: add backend logging foundation"
```

## Task 14: Add Integration Guide

**Files:**
- Create: `backend/docs/integration-guide.md`

**Step 1: Write guide sections**

Document:

- how to run backend locally
- required env variables
- how to run tests
- how to mount a new module route
- how to use `authenticate`
- how to use `authorize`
- how to use `validateRequest`
- how to throw `AppError`
- auth response shape
- frontend token header format

**Step 2: Verify guide references exact files**

Check that every path mentioned exists or is planned in this implementation plan.

**Step 3: Commit**

```bash
git add backend/docs/integration-guide.md
git commit -m "docs: add backend integration guide"
```

## Task 15: Final Verification

**Files:**
- Modify only if final verification reveals a bug.

**Step 1: Run all tests**

Run:

```bash
cd backend
npm test
```

Expected: PASS.

**Step 2: User manually verifies local run**

Ask the user to run:

```bash
cd backend
npm run dev
```

Expected: backend starts on configured port.

**Step 3: User manually verifies DB setup**

Ask the user to run the SQL setup through XAMPP/MySQL using `backend/docs/database-setup.md`.

Expected: tables exist and DB connection succeeds.

**Step 4: Commit final fixes if needed**

```bash
git add backend
git commit -m "fix: stabilize backend foundation auth"
```

## Execution Notes

- Keep commits frequent and scoped.
- Do not implement business modules outside `auth`.
- Do not run server, DB, migration, or Prisma commands autonomously.
- Prefer tests before implementation for service, middleware, utilities, and routes.
- Keep auth decisions aligned with `docs/plans/2026-06-02-backend-foundation-auth-design.md`.
