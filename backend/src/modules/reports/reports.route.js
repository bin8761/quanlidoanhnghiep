const express = require("express");
const controller = require("./reports.controller");
const validators = require("./reports.validator");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const validateRequest = require("../../middlewares/validateRequest");

const router = express.Router();
router.use(authenticate, passwordChangeGuard, authorize("ADMIN"));
router.get("/summary", validateRequest(validators.common), controller.summary);
router.get("/assets-by-category", validateRequest(validators.common), controller.assetsByCategory);
router.get("/assets-by-department", validateRequest(validators.department), controller.assetsByDepartment);
router.get("/trends", validateRequest(validators.common), controller.trends);
router.get("/data-quality", validateRequest(validators.common), controller.dataQuality);
router.get("/assets", validateRequest(validators.assets), controller.assets);
router.get("/export.csv", validateRequest(validators.assets), controller.exportCsv);

module.exports = router;
