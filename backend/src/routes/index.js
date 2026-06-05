const express = require("express");
const healthController = require("./health.controller");
const authRouter = require("../modules/auth/auth.route");
const categoryRouter = require("../modules/categories/category.route");
const { AUTH_ROUTE_PREFIX } = require("../modules/auth/auth.constants");

const rootRouter = express.Router();
const apiRouter = express.Router();

apiRouter.get("/health", healthController.check);
apiRouter.use(AUTH_ROUTE_PREFIX, authRouter);
apiRouter.use("/categories", categoryRouter);

rootRouter.use("/api", apiRouter);

module.exports = rootRouter;
