# AWS Deployment Notes

## Target Architecture

- RDS MySQL stores production data. Use a private subnet, automated backups, encryption at rest, and a security group that only allows inbound MySQL traffic from the backend runtime.
- Backend can run on Elastic Beanstalk Node.js or EC2 behind an Application Load Balancer. Elastic Beanstalk is the shorter path for the final week because it handles process supervision, deployment versions, and CloudWatch integration.
- S3 stores uploaded asset images and maintenance documents if uploads are included. Keep buckets private and serve files through presigned URLs or a controlled backend endpoint.
- CloudWatch receives application logs and platform logs. Set retention explicitly, for example 14 or 30 days for staging and longer for production if required.

## Required Environment Variables

- `NODE_ENV=production`
- `PORT=8080` or the platform-provided port
- `DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MAIL_*` variables if password reset email is enabled
- `S3_BUCKET`, `AWS_REGION`, and upload-related variables if S3 uploads are enabled

## Deployment Flow

1. Create the RDS MySQL instance and database user.
2. Store secrets in Elastic Beanstalk environment properties, EC2 instance environment, or AWS Systems Manager Parameter Store.
3. Run Prisma migrations against production:

   ```bash
   npx prisma migrate deploy
   ```

4. Build and deploy the backend package.
5. Verify `/api/health`.
6. Smoke test authenticated APIs:
   - `POST /api/assignments/assign`
   - `POST /api/assignments/return`
   - `POST /api/assignments/transfer`
   - `GET /api/maintenance-requests`
   - `GET /api/inventory-sessions`
   - `GET /api/reports/summary`
7. Confirm CloudWatch logs include request IDs and backend errors.

## Frontend Handoff

- Admin frontend can build screens for assignment, return, transfer, maintenance status updates, inventory sessions/items, and reports.
- Employee frontend can create maintenance requests and show request status through `GET /api/maintenance-requests?requesterId=<employeeId>`.
- Report endpoints return aggregate payloads ready for cards and charts.
