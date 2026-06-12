# Backend Codebase Analysis

Nguon phan tich: `backend/` trong repo `appquanlidoanhnghiep`.

## 1. Tech Stack Chinh

- Backend la `Node.js >=20` + `Express 5` dang CommonJS; entry file khai bao o `backend/package.json`.
- ORM/database la `Prisma 6` voi `MySQL`, datasource lay tu `DATABASE_URL` trong `backend/prisma/schema.prisma`.
- Auth la JWT + `jsonwebtoken`, password hash bang `bcrypt`, request validation bang `zod`.
- Mail dung `nodemailer`, logging dung `pino`, upload dung `multer`, xu ly anh dung `sharp`.
- Export bao cao dung `exceljs` va `pdfkit`.
- Test stack la `Jest` + `supertest`; lint bang ESLint; seed DB bang Prisma seed.

## 2. Entry Points Chinh Cua He Thong

- Runtime entrypoint la `backend/src/app/server.js`:
  - `startServer()` goi `checkDatabaseConnection()`
  - sau do `app.listen(env.port, ...)`
- Express app duoc lap o `backend/src/app/app.js`:
  - gan `helmet`, `cors`, `requestId`, JSON parser, request logger
  - serve static `/uploads`
  - mount router tong
  - gan `errorHandler`
- API root la `backend/src/routes/index.js`, mount toan bo duoi `/api`.
- Entry phu:
  - DB seed: `backend/prisma/seed.js` qua script `db:seed`
  - Notification realtime stream: `/api/notifications/stream`

## 3. Cau Truc Module/Thu Muc Quan Trong

- `backend/src/app/`: bootstrap app va server
- `backend/src/config/`: config runtime nhu env, DB, logger, mail
- `backend/src/routes/`: router root va health endpoint
- `backend/src/middlewares/`: auth, authorize, validateRequest, rate limit, upload, request logging, error handling
- `backend/src/modules/`: domain modules
- `backend/src/shared/`: error model, response wrapper, utils chung
- `backend/prisma/`: schema, migrations, seed
- `backend/tests/`: unit + integration
- `backend/uploads/`: file tinh local da upload, duoc serve truc tiep tu Express

### Pattern module chinh

Phan lon module di theo pattern:

`route -> controller -> service -> repository -> Prisma`

### Cac domain module business thay ro

- `auth`
- `employees`
- `assets`
- `assignments`
- `supportRequests`
- `maintenanceRequests`
- `inventory`
- `reports`
- `notifications`
- `attendance`
- `loginHistory`
- `feedbacks`
- `faqs`
- `departments`
- `categories`
- `locations`
- `tasks`

## 4. Request Flow Va Data Flow Chinh

### Request flow chuan

1. Request vao Express app o `backend/src/app/app.js`.
2. Qua middleware nen:
   - request ID
   - CORS
   - body parser
   - request logger
3. Vao router `/api/...` o `backend/src/routes/index.js`.
4. O tung module, thuong qua:
   - `authenticate`
   - `passwordChangeGuard`
   - `authorize`
   - `validateRequest`
5. `validateRequest` parse `body/params/query` bang Zod.
6. Controller goi service.
7. Service xu ly business rule.
8. Repository goi Prisma va truy cap MySQL.
9. Response tra theo format chung `sendSuccess/sendError`.
10. Loi duoc chuan hoa va tra qua `errorHandler`.

### Auth flow

- JWT duoc doc tu header `Authorization: Bearer ...`
- Token duoc verify trong `authenticate`
- Payload hop le duoc dat vao `req.user`
- Login tao access token qua `token.util`
- Forgot-password flow:
  - tao OTP trong DB
  - gui OTP qua SMTP mail service
  - verify OTP
  - reset password

### Data flow cheo module

- `supportRequests.service` sau khi tao/cap nhat request se:
  - goi notifications
  - goi tasks
- `notifications.service`:
  - ghi `Notification` vao DB
  - push realtime SSE qua in-memory hub
- `tasks.service`/`tasks.repository`:
  - tao task follow-up vao bang `UserTask`
  - hoac mark task hoan tat/huy

## 5. Cac Thanh Phan Ha Tang Co The Suy Ra Tu Code

### Database

Chac chan co:

- `MySQL`
- `Prisma`

Bang chung truc tiep:

- `provider = "mysql"` trong `backend/prisma/schema.prisma`
- Prisma client duoc khoi tao trong `backend/src/config/database.js`

### Cache

Chua thay Redis/Memcached.

Chi thay cache/in-memory cuc bo:

- Prisma client singleton tren `globalThis`
- token bucket rate limiter theo process
- SSE client registry bang `Map`

### Queue / Message Broker

Chua thay:

- RabbitMQ
- Kafka
- SQS
- Bull/BullMQ

Notification publish hien tai la synchronous in-process.

### Object Storage

Tu code hien tai, file chu yeu la local uploads hoac xu ly trong memory:

- Express serve local `uploads/`
- upload middleware dung `multer.memoryStorage()`
- feedbacks route cung dung `multer.memoryStorage()`

Co tai lieu AWS/S3 trong `backend/docs`, nhung do chua phai bang chung runtime integration.

### Worker / Background Job

Chua thay:

- worker process rieng
- queue consumer
- background processor tach biet

### Cron / Scheduler

Chua thay:

- `node-cron`
- agenda
- bull repeatable jobs
- entrypoint cron rieng

### Realtime

Co, bang Server-Sent Events:

- endpoint `/api/notifications/stream`
- xac thuc bang token query param
- giu ket noi bang heartbeat
- push su kien qua in-memory hub

### Email

Co SMTP mail service chac chan:

- env bat buoc `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`
- implementation trong `backend/src/config/mail.js`

## 6. Phan Nao Chac Chan Suy Ra Tu Code, Phan Nao Chua Ro

### Chac chan tu code

- Day la backend monolith dang modular REST API, khong phai microservices.
- Dung Express + Prisma + MySQL + JWT + Zod + Jest.
- Hau het business flow di theo `route -> controller -> service -> repository -> Prisma`.
- Co mail SMTP cho OTP reset password.
- Co realtime notification bang SSE.
- Co upload file local/in-memory.
- Co cac domain chinh:
  - auth
  - tai san
  - nhan su
  - ban giao
  - yeu cau ho tro/bao tri
  - kiem ke
  - bao cao
  - attendance
  - feedback
  - FAQ
  - notification
  - login history

### Chua ro hoac chua the ket luan chac

- Co trien khai object storage that su nhu S3 trong runtime hay khong.
- Co cache phan tan/Redis o moi truong deploy hay khong.
- Co worker/cron chay ngoai repo nay hay khong.
- Co API gateway, reverse proxy, load balancer, container orchestration o production hay khong.
- `maintenanceRequests` va `supportRequests` la hai bounded context rieng hay chi la lop compatibility/rename.
  - Schema hien tai map `SupportRequest` vao bang `maintenance_requests`, nen naming con giao thoa.

## Ket Luan Ngan

Repo backend nay la mot REST API monolith theo kieu module-based, dung Node.js/Express va Prisma/MySQL. Kien truc ben trong kha ro rang, co tach lop route/controller/service/repository, co auth JWT, validation, SMTP mail, upload file, notification realtime bang SSE, va reporting/export. Phan ha tang nang hon nhu Redis, queue, worker, cron, object storage phan tan hien chua thay bang chung truc tiep tu code runtime.
