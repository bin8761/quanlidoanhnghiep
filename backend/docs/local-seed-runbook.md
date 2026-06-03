# Local Auth Seed Runbook

This runbook pairs with `backend/prisma/seed.js`.

## Seeded Accounts

- `admin@company.local` / `Admin123`
- `inactive.employee@company.local` / `Inactive123`
- `firstlogin.employee@company.local` / `Password123`
- `active.employee@company.local` / `Active1234`

## Seeded Employees

- `EMP001` / `nouser.employee@company.local`
- `EMP002` / `inactive.employee@company.local`
- `EMP003` / `firstlogin.employee@company.local`
- `EMP004` / `active.employee@company.local`

## What This Seed Supports

- Admin login and admin-only APIs.
- Create-user flow for employee `EMP001`, who intentionally has no user account yet.
- Inactive-user login rejection for `inactive.employee@company.local`.
- First-login password-change flow for `firstlogin.employee@company.local`.
- Normal login and forgot-password flow for `active.employee@company.local`.

## Seed Command

Run from the `backend/` directory.

```powershell
npx prisma db seed
```

## Postman Defaults To Use

- `adminEmail`: `admin@company.local`
- `adminPassword`: `Admin123`
- `userEmail`: `active.employee@company.local`
- `userPassword`: `Active1234`
- `currentPassword`: `Active1234`
- `forgotPasswordEmail`: `active.employee@company.local`
- `employeeIdToCreate`: `11111111-1111-4111-8111-111111111111`
- `targetUserId`: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`
- `targetUserActive`: `true`

## Current Seed Output

The current local seed run produced these ids:

- `noUserEmployeeId`: `11111111-1111-4111-8111-111111111111`
- `inactiveEmployeeId`: `22222222-2222-4222-8222-222222222222`
- `firstLoginEmployeeId`: `33333333-3333-4333-8333-333333333333`
- `activeEmployeeId`: `44444444-4444-4444-8444-444444444444`
- `adminUserId`: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`
- `inactiveUserId`: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`
- `firstLoginUserId`: `cccccccc-cccc-4ccc-8ccc-cccccccccccc`
- `activeUserId`: `dddddddd-dddd-4ddd-8ddd-dddddddddddd`

## Verification Queries

```powershell
npx prisma db seed
```

The seed command prints the account credentials plus the created employee and user ids. Use those ids directly in Postman.
