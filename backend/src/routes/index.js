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
const inventoryRouter = require("../modules/inventory/inventory.route");
const reportsRouter = require("../modules/reports/reports.route");

const rootRouter = express.Router();
const apiRouter = express.Router();

apiRouter.get("/health", healthController.check);
apiRouter.use(AUTH_ROUTE_PREFIX, authRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/employees", employeesRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/assignments", assignmentsRouter);
apiRouter.use("/maintenance-requests", maintenanceRequestsRouter);
apiRouter.use("/", inventoryRouter);
apiRouter.use("/reports", reportsRouter);

rootRouter.use("/api", apiRouter);

module.exports = rootRouter;
