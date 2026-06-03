## API And Integration Test Strategy

This folder contains Supertest-based API coverage for the backend auth foundation.

### Express App Strategy

- Supertest targets `src/app/app.js` directly.
- Automated tests never start a real HTTP server process.
- Test-only protected-route coverage is added by the integration harness after the app is loaded.

### Gmail SMTP Strategy

- Automated tests mock `nodemailer.createTransport(...)`.
- No real Gmail credentials or outbound SMTP calls are required.
- Tests can assert SMTP usage through the mocked transport when needed.

### Prisma Test Database Strategy

- Chosen strategy for this TDD cluster: use a stateful in-memory Prisma mock instead of a real test database.
- The mock is injected at the `src/config/database.js` module boundary, so the request path still exercises:
  app -> routes -> middleware -> controller -> service -> repository.
- This keeps automated integration tests deterministic and avoids requiring user-run Prisma CLI commands, schema migrations, or a dedicated MySQL test schema.
- Manual/local end-to-end verification against XAMPP MySQL remains a separate user-run activity under the later done-criteria tasks.

### Seed Data Shape

- One fixed `ADMIN`.
- One employee without a user account.
- One existing employee with a `USER` account.
- One `USER` with `mustChangePassword = true`.
- One active `USER` with normal login access.

