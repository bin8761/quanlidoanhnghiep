const express = require("express");

const authController = require("./auth.controller");
const authService = require("./auth.service");
const authRepository = require("./auth.repository");
const authValidators = require("./auth.validator");
const validateRequest = require("../../middlewares/validateRequest");
const createTokenBucketRateLimit = require("../../middlewares/tokenBucketRateLimit");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ROLES } = require("./auth.constants");

const authRouter = express.Router();
const tokenBucketRateLimit = createTokenBucketRateLimit();

authRouter.post(
  "/login",
  tokenBucketRateLimit,
  validateRequest(authValidators.login),
  authController.login,
);

authRouter.get(
  "/me",
  tokenBucketRateLimit,
  authenticate,
  authController.me,
);

authRouter.post(
  "/logout",
  tokenBucketRateLimit,
  authenticate,
  authController.logout,
);

authRouter.put(
  "/change-password",
  tokenBucketRateLimit,
  authenticate,
  validateRequest(authValidators.changePassword),
  authController.changePassword,
);

authRouter.post(
  "/forgot-password",
  tokenBucketRateLimit,
  validateRequest(authValidators.forgotPassword),
  authController.forgotPassword,
);

authRouter.post(
  "/verify-forgot-password-otp",
  tokenBucketRateLimit,
  validateRequest(authValidators.verifyForgotPasswordOtp),
  authController.verifyForgotPasswordOtp,
);

authRouter.post(
  "/reset-password",
  tokenBucketRateLimit,
  validateRequest(authValidators.resetPassword),
  authController.resetPassword,
);

authRouter.post(
  "/users",
  tokenBucketRateLimit,
  authenticate,
  passwordChangeGuard,
  authorize(ROLES.ADMIN),
  validateRequest(authValidators.createUser),
  authController.createUser,
);

authRouter.patch(
  "/users/:id/status",
  tokenBucketRateLimit,
  authenticate,
  passwordChangeGuard,
  authorize(ROLES.ADMIN),
  validateRequest(authValidators.updateUserStatus),
  authController.updateUserStatus,
);

void authService;
void authRepository;

module.exports = authRouter;
