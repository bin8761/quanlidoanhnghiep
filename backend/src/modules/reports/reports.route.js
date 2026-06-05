const express = require("express");
const controller = require("./reports.controller");
const authenticate = require("../../middlewares/authenticate");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");

const router = express.Router();

router.get("/summary", authenticate, passwordChangeGuard, controller.summary);
router.get("/assets-by-category", authenticate, passwordChangeGuard, controller.assetsByCategory);
router.get("/assets-by-department", authenticate, passwordChangeGuard, controller.assetsByDepartment);

module.exports = router;
