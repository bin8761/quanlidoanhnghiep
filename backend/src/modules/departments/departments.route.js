const express = require("express");
const departmentsController = require("./departments.controller");
const departmentsValidators = require("./departments.validator");
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
  departmentsController.listDepartments,
);

router.get(
  "/dashboard/summary",
  authenticate,
  passwordChangeGuard,
  departmentsController.getDashboardSummary,
);

router.get(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(departmentsValidators.getById),
  departmentsController.getDepartment,
);

router.post(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(departmentsValidators.create),
  departmentsController.createDepartment,
);

router.put(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(departmentsValidators.update),
  departmentsController.updateDepartment,
);

router.delete(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(departmentsValidators.delete),
  departmentsController.deleteDepartment,
);

router.post(
  "/:id/quotas",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(departmentsValidators.updateQuotas),
  departmentsController.updateQuotas,
);

module.exports = router;
