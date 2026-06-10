const express = require("express");
const employeesController = require("./employees.controller");
const employeesValidators = require("./employees.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.get(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  employeesController.listEmployees,
);

router.get(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(employeesValidators.getById),
  employeesController.getEmployee,
);

router.post(
  "/import",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(employeesValidators.import),
  employeesController.importEmployees,
);

router.post(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(employeesValidators.create),
  employeesController.createEmployee,
);

router.put(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(employeesValidators.update),
  employeesController.updateEmployee,
);

router.delete(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(employeesValidators.delete),
  employeesController.deleteEmployee,
);

router.get(
  "/:id/attachments",
  authenticate,
  passwordChangeGuard,
  employeesController.getAttachments,
);

router.post(
  "/:id/attachments",
  authenticate,
  passwordChangeGuard,
  employeesController.uploadAttachment,
);

router.delete(
  "/:id/attachments/:attachmentId",
  authenticate,
  passwordChangeGuard,
  employeesController.deleteAttachment,
);

router.get(
  "/:id/logs",
  authenticate,
  passwordChangeGuard,
  employeesController.getProfileLogs,
);

module.exports = router;
