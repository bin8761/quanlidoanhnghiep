# Prisma Workflow Notes

This project uses Prisma with MySQL.

## Current State

- `prisma/schema.prisma` already exists in this repository.
- `backend/.env.example` already documents the required `DATABASE_URL`.
- `prisma/seed.js` now exists for local auth/demo data.
- Do not run Prisma commands until the local `.env` is prepared with a valid MySQL connection string.

## User-Run Commands

Run these commands from the `backend/` directory.

### 1. Initialize Prisma

Use this only if Prisma needs to be initialized again manually.
Do not run it if the existing `prisma/` folder and `schema.prisma` should be kept as-is.

```bash
npx prisma init --datasource-provider mysql
```

### 2. Create And Apply The Local Migration

After `DATABASE_URL` is configured and the schema is ready:

```bash
npx prisma migrate dev --name init_auth_foundation
```

If you are switching an existing local database from numeric ids to UUID ids, reset the local database first:

```bash
npx prisma migrate reset
```

### 3. Generate Prisma Client

Run client generation after schema changes or migration updates:

```bash
npx prisma generate
```

### 4. Seed Local Auth Data

After migrations are applied:

```bash
npx prisma db seed
```

## Important Notes

- The user is responsible for reviewing schema changes before migration.
- If `prisma init` would overwrite or conflict with the current `prisma/` folder, skip it and continue with migration and client generation only.
- The current seed script provisions one fixed `ADMIN`, one employee without a user, one inactive `USER`, one first-login `USER`, and one active `USER`.
- The current schema uses UUID string ids for `Employee`, `User`, and `PasswordResetOtp`.
