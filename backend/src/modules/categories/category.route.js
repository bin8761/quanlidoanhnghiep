const express = require("express");

const categoryController = require("./category.controller");
const categoryValidators = require("./category.validator");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const validateRequest = require("../../middlewares/validateRequest");
const createTokenBucketRateLimit = require("../../middlewares/tokenBucketRateLimit");
const ROLES = require("../../shared/constants/roles");

const categoryRouter = express.Router();
const tokenBucketRateLimit = createTokenBucketRateLimit();

categoryRouter.use(
  tokenBucketRateLimit,
  authenticate,
  passwordChangeGuard,
  authorize(ROLES.ADMIN),
);

categoryRouter.get("/", validateRequest(categoryValidators.list), categoryController.list);
categoryRouter.post("/", validateRequest(categoryValidators.create), categoryController.create);
categoryRouter.put("/:id", validateRequest(categoryValidators.update), categoryController.update);
categoryRouter.delete("/:id", validateRequest(categoryValidators.remove), categoryController.remove);

module.exports = categoryRouter;
