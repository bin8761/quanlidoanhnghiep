const express = require("express");
const controller = require("./loginHistory.controller");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

// Admin sees all logs
router.get(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  controller.listAllLogs,
);

// Users see their own logs
router.get(
  "/my",
  authenticate,
  passwordChangeGuard,
  controller.listMyLogs,
);

module.exports = router;
