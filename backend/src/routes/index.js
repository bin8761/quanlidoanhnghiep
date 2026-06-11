const express = require("express");
const healthController = require("./health.controller");
const authRouter = require("../modules/auth/auth.route");
const { AUTH_ROUTE_PREFIX } = require("../modules/auth/auth.constants");
const departmentsRouter = require("../modules/departments/departments.route");
const categoriesRouter = require("../modules/categories/categories.route");
const employeesRouter = require("../modules/employees/employees.route");
const assetsRouter = require("../modules/assets/assets.route");
const assignmentsRouter = require("../modules/assignments/assignments.route");
const maintenanceRequestsRouter = require("../modules/maintenanceRequests/maintenanceRequests.route");
const supportRequestsRouter = require("../modules/supportRequests/supportRequests.route");
const inventoryRouter = require("../modules/inventory/inventory.route");
const reportsRouter = require("../modules/reports/reports.route");
const notificationsRouter = require("../modules/notifications/notifications.route");
const locationsRouter = require("../modules/locations/locations.route");
const tasksRouter = require("../modules/tasks/tasks.route");
const supportChatRouter = require("../modules/supportChat/supportChat.route");
const faqsRouter = require("../modules/faqs/faqs.route");
const feedbacksRouter = require("../modules/feedbacks/feedbacks.route");
const attendanceRouter = require("../modules/attendance/attendance.route");
const loginHistoryRouter = require("../modules/loginHistory/loginHistory.route");

const rootRouter = express.Router();
const apiRouter = express.Router();

apiRouter.get("/health", healthController.check);
apiRouter.use(AUTH_ROUTE_PREFIX, authRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/employees", employeesRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/assignments", assignmentsRouter);
apiRouter.use("/support-requests", supportRequestsRouter);
apiRouter.use("/maintenance-requests", maintenanceRequestsRouter);
apiRouter.use("/", inventoryRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/support-chat", supportChatRouter);
apiRouter.use("/faqs", faqsRouter);
apiRouter.use("/feedbacks", feedbacksRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/login-histories", loginHistoryRouter);

rootRouter.use("/api", apiRouter);

module.exports = rootRouter;

