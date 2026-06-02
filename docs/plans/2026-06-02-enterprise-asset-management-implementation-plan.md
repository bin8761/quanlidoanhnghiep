# Enterprise Asset Management MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy an Enterprise Asset Management MVP for an internship project with React, Node.js/Express, MySQL, and AWS.

**Architecture:** The app uses a React frontend, an Express REST API backend, and MySQL persistence. Local development uses XAMPP MySQL; production uses AWS RDS MySQL, with optional S3 asset image uploads and CloudWatch logging.

**Tech Stack:** React, Vite, Node.js, Express, MySQL, JWT, bcrypt, AWS RDS, AWS S3, AWS EC2 or Elastic Beanstalk, AWS Amplify or S3 plus CloudFront, AWS CloudWatch.

---

## Phase 1: Project Setup And Contracts

### Task 1: Create Repository Structure

**Files:**
- Create: `frontend/`
- Create: `backend/`
- Create: `docs/api/`
- Create: `docs/database/`
- Create: `docs/demo/`

**Step 1: Create frontend project**

Run:

```bash
npm create vite@latest frontend -- --template react
```

Expected: Vite creates a React app under `frontend/`.

**Step 2: Create backend project**

Run:

```bash
mkdir backend
cd backend
npm init -y
```

Expected: `backend/package.json` exists.

**Step 3: Add backend dependencies**

Run:

```bash
npm install express mysql2 dotenv cors jsonwebtoken bcrypt zod multer
npm install -D nodemon jest supertest
```

Expected: dependencies are recorded in `backend/package.json`.

**Step 4: Commit**

```bash
git add frontend backend docs
git commit -m "chore: initialize asset management project"
```

### Task 2: Define API Contract

**Files:**
- Create: `docs/api/api-contract.md`

**Step 1: Document auth endpoints**

Add endpoints for `POST /api/auth/login`, `GET /api/auth/me`, and `PUT /api/auth/change-password` with request and response examples.

**Step 2: Document admin endpoints**

Add endpoint groups for assets, categories, employees, departments, assignments, maintenance, inventory, and reports.

**Step 3: Document role rules**

Define `ADMIN` access for management APIs and `USER` access for profile, assigned assets, and maintenance requests.

**Step 4: Commit**

```bash
git add docs/api/api-contract.md
git commit -m "docs: add api contract for asset management mvp"
```

### Task 3: Define MySQL Schema

**Files:**
- Create: `docs/database/schema.sql`
- Create: `docs/database/seed.sql`

**Step 1: Create tables**

Define tables for `users`, `employees`, `departments`, `asset_categories`, `assets`, `asset_assignments`, `maintenance_requests`, `inventory_sessions`, and `inventory_items`.

**Step 2: Add constraints**

Add primary keys, foreign keys, unique asset codes, unique employee codes, and enum-like status fields.

**Step 3: Add seed data**

Create admin/user accounts, departments, employees, categories, assets, sample assignments, and maintenance requests.

**Step 4: User-run database setup**

Ask the user/team to import `docs/database/schema.sql` and `docs/database/seed.sql` into XAMPP MySQL. Do not run DB commands autonomously.

**Step 5: Commit**

```bash
git add docs/database/schema.sql docs/database/seed.sql
git commit -m "docs: add mysql schema and seed data"
```

## Phase 2: Backend Core

### Task 4: Implement Express App Skeleton

**Files:**
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/config/database.js`
- Create: `backend/src/middleware/errorHandler.js`

**Step 1: Add Express app**

Create an Express app with `cors`, JSON parsing, health route, and centralized error handling.

**Step 2: Add database pool**

Use `mysql2/promise` and environment variables for host, port, user, password, and database name.

**Step 3: Add health route**

Add `GET /api/health` returning `{ "status": "ok" }`.

**Step 4: Test**

Run:

```bash
cd backend
npm test
```

Expected: PASS after adding a simple health route test.

**Step 5: Commit**

```bash
git add backend/src backend/package.json
git commit -m "feat: add express app skeleton"
```

### Task 5: Implement Auth And Role Middleware

**Files:**
- Create: `backend/src/modules/auth/auth.routes.js`
- Create: `backend/src/modules/auth/auth.controller.js`
- Create: `backend/src/modules/auth/auth.service.js`
- Create: `backend/src/middleware/authenticate.js`
- Create: `backend/src/middleware/authorize.js`
- Test: `backend/tests/auth.test.js`

**Step 1: Write API tests**

Cover successful login, invalid password, `GET /api/auth/me`, and user access without token.

**Step 2: Implement login**

Validate email/password, compare bcrypt password hash, and return JWT plus user role.

**Step 3: Implement guards**

Add `authenticate` middleware for JWT verification and `authorize(...roles)` for route-level role checks.

**Step 4: Run tests**

Run:

```bash
cd backend
npm test -- auth.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/auth backend/src/middleware backend/tests/auth.test.js
git commit -m "feat: add authentication and role guards"
```

## Phase 3: Admin Management APIs

### Task 6: Implement Asset Category APIs

**Files:**
- Create: `backend/src/modules/categories/categories.routes.js`
- Create: `backend/src/modules/categories/categories.controller.js`
- Create: `backend/src/modules/categories/categories.service.js`
- Test: `backend/tests/categories.test.js`

**Step 1: Write tests**

Cover list, create, update, delete, and duplicate category name.

**Step 2: Implement CRUD**

Restrict create/update/delete to `ADMIN`.

**Step 3: Run tests**

Run:

```bash
cd backend
npm test -- categories.test.js
```

Expected: PASS.

**Step 4: Commit**

```bash
git add backend/src/modules/categories backend/tests/categories.test.js
git commit -m "feat: add asset category management"
```

### Task 7: Implement Department And Employee APIs

**Files:**
- Create: `backend/src/modules/departments/`
- Create: `backend/src/modules/employees/`
- Test: `backend/tests/departments.test.js`
- Test: `backend/tests/employees.test.js`

**Step 1: Write tests**

Cover CRUD operations and employee filtering by department.

**Step 2: Implement department CRUD**

Restrict management routes to `ADMIN`.

**Step 3: Implement employee CRUD**

Allow admin to link employees to departments and user accounts.

**Step 4: Run tests**

Run:

```bash
cd backend
npm test -- departments.test.js employees.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/departments backend/src/modules/employees backend/tests
git commit -m "feat: add department and employee management"
```

### Task 8: Implement Asset APIs

**Files:**
- Create: `backend/src/modules/assets/assets.routes.js`
- Create: `backend/src/modules/assets/assets.controller.js`
- Create: `backend/src/modules/assets/assets.service.js`
- Test: `backend/tests/assets.test.js`

**Step 1: Write tests**

Cover asset listing, search, detail, create, update, delete, and category filtering.

**Step 2: Implement asset CRUD**

Support asset code, name, category, serial number, value, purchase date, status, image URL, and notes.

**Step 3: Protect status rules**

Prevent deleting assets with active assignment records unless the MVP explicitly allows soft delete.

**Step 4: Run tests**

Run:

```bash
cd backend
npm test -- assets.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add backend/src/modules/assets backend/tests/assets.test.js
git commit -m "feat: add asset management api"
```

## Phase 4: Asset Lifecycle APIs

### Task 9: Implement Assignment Workflows

**Files:**
- Create: `backend/src/modules/assignments/assignments.routes.js`
- Create: `backend/src/modules/assignments/assignments.controller.js`
- Create: `backend/src/modules/assignments/assignments.service.js`
- Test: `backend/tests/assignments.test.js`

**Step 1: Write tests**

Cover assign available asset, reject assigning already assigned asset, return asset, transfer asset, and view history.

**Step 2: Implement assignment transaction**

Create an `ACTIVE` assignment and update the asset status to `ASSIGNED` in one transaction.

**Step 3: Implement return workflow**

Mark active assignment as `RETURNED` and update asset status to `AVAILABLE`.

**Step 4: Implement transfer workflow**

Mark old assignment as `TRANSFERRED`, create new `ACTIVE` assignment, and keep asset status `ASSIGNED`.

**Step 5: Run tests**

Run:

```bash
cd backend
npm test -- assignments.test.js
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/modules/assignments backend/tests/assignments.test.js
git commit -m "feat: add asset assignment workflows"
```

### Task 10: Implement Maintenance Requests

**Files:**
- Create: `backend/src/modules/maintenance/maintenance.routes.js`
- Create: `backend/src/modules/maintenance/maintenance.controller.js`
- Create: `backend/src/modules/maintenance/maintenance.service.js`
- Test: `backend/tests/maintenance.test.js`

**Step 1: Write tests**

Cover user creating request, admin updating status, repair cost update, and user viewing own request status.

**Step 2: Implement create request**

Allow `USER` and `ADMIN` to create a maintenance request for an assigned or known asset.

**Step 3: Implement admin status update**

Allow `ADMIN` to move status through `PENDING`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`.

**Step 4: Update asset status**

Set asset status to `BROKEN` when reported and `MAINTENANCE` when processing.

**Step 5: Run tests**

Run:

```bash
cd backend
npm test -- maintenance.test.js
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/modules/maintenance backend/tests/maintenance.test.js
git commit -m "feat: add maintenance request workflow"
```

### Task 11: Implement Inventory And Reports

**Files:**
- Create: `backend/src/modules/inventory/`
- Create: `backend/src/modules/reports/`
- Test: `backend/tests/inventory.test.js`
- Test: `backend/tests/reports.test.js`

**Step 1: Write inventory tests**

Cover create session, list session assets by department, update item result, and complete session.

**Step 2: Implement inventory APIs**

Support simple `OK`, `MISSING`, and `DAMAGED` item results.

**Step 3: Write report tests**

Cover summary counts, total asset value, assets by category, and assets by department.

**Step 4: Implement report queries**

Use SQL aggregate queries and return frontend-friendly JSON.

**Step 5: Run tests**

Run:

```bash
cd backend
npm test -- inventory.test.js reports.test.js
```

Expected: PASS.

**Step 6: Commit**

```bash
git add backend/src/modules/inventory backend/src/modules/reports backend/tests
git commit -m "feat: add inventory and reports"
```

## Phase 5: Frontend

### Task 12: Implement Frontend Foundation

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/auth/AuthContext.jsx`
- Create: `frontend/src/routes/AppRoutes.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Add API client**

Create an API client that attaches the JWT token and handles base URL configuration.

**Step 2: Add auth context**

Store current user, token, login, logout, and role.

**Step 3: Add protected routes**

Protect admin routes with `ADMIN` and employee routes with `USER`.

**Step 4: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

**Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat: add frontend auth foundation"
```

### Task 13: Implement Admin Screens

**Files:**
- Create: `frontend/src/pages/admin/DashboardPage.jsx`
- Create: `frontend/src/pages/admin/AssetsPage.jsx`
- Create: `frontend/src/pages/admin/CategoriesPage.jsx`
- Create: `frontend/src/pages/admin/EmployeesPage.jsx`
- Create: `frontend/src/pages/admin/DepartmentsPage.jsx`
- Create: `frontend/src/pages/admin/AssignmentsPage.jsx`
- Create: `frontend/src/pages/admin/MaintenancePage.jsx`
- Create: `frontend/src/pages/admin/InventoryPage.jsx`
- Create: `frontend/src/pages/admin/ReportsPage.jsx`

**Step 1: Build dashboard**

Show total assets, assigned assets, broken assets, maintenance count, and total asset value.

**Step 2: Build CRUD pages**

Implement list, create, edit, delete, search, and filter interactions for core entities.

**Step 3: Build workflow pages**

Implement assign, recall, transfer, maintenance status update, and inventory result update screens.

**Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

**Step 5: Commit**

```bash
git add frontend/src/pages/admin
git commit -m "feat: add admin management screens"
```

### Task 14: Implement Employee Screens

**Files:**
- Create: `frontend/src/pages/user/ProfilePage.jsx`
- Create: `frontend/src/pages/user/MyAssetsPage.jsx`
- Create: `frontend/src/pages/user/AssetDetailPage.jsx`
- Create: `frontend/src/pages/user/ReportIssuePage.jsx`
- Create: `frontend/src/pages/user/HistoryPage.jsx`

**Step 1: Build profile page**

Display employee profile and basic account information.

**Step 2: Build assigned assets page**

Show assets currently assigned to the employee.

**Step 3: Build report issue flow**

Allow employee to submit a broken asset report and track maintenance status.

**Step 4: Run build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds.

**Step 5: Commit**

```bash
git add frontend/src/pages/user
git commit -m "feat: add employee self-service screens"
```

## Phase 6: AWS Deployment And Demo

### Task 15: Configure Production Environment

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`
- Create: `docs/deployment/aws-deployment.md`

**Step 1: Document environment variables**

List backend DB, JWT, CORS, S3, and frontend API URL variables.

**Step 2: Document AWS services**

Document RDS MySQL, S3, backend deployment target, frontend deployment target, and CloudWatch.

**Step 3: User-run AWS setup**

Ask the user/team to create AWS resources and provide environment values. Do not run cloud deployment commands without explicit approval.

**Step 4: Commit**

```bash
git add backend/.env.example frontend/.env.example docs/deployment/aws-deployment.md
git commit -m "docs: add aws deployment guide"
```

### Task 16: Prepare Demo And QA Materials

**Files:**
- Create: `docs/demo/demo-script.md`
- Create: `docs/demo/test-cases.md`
- Create: `docs/demo/accounts.md`

**Step 1: Write demo script**

Cover admin login, asset creation, assignment, employee asset view, broken asset report, maintenance update, inventory, and reports.

**Step 2: Write test cases**

List manual test cases for all critical workflows.

**Step 3: Document demo accounts**

Include sample admin and employee accounts without real secrets.

**Step 4: Commit**

```bash
git add docs/demo
git commit -m "docs: add demo and qa materials"
```

## Recommended Milestones

- End of week 1: schema, API contract, app skeleton, login flow.
- End of week 2: core CRUD complete.
- End of week 3: assignment, employee views, broken asset report complete.
- End of week 4: maintenance, inventory, reports, first AWS deployment complete.
- End of week 5: final deployment, demo data, QA, presentation complete.

## Execution Notes

- Keep the MVP scope fixed unless the team finishes early.
- Treat S3 upload as a stretch feature if backend, frontend, and deployment are not stable by week 4.
- Run backend tests before merging backend changes.
- Run frontend builds before merging frontend changes.
- Deploy a test version to AWS before the final week.
