const express = require("express");
const controller = require("./supportRequests.controller");
const validators = require("./supportRequests.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.get("/", authenticate, passwordChangeGuard, validateRequest(validators.list), controller.list);
router.post("/", authenticate, passwordChangeGuard, validateRequest(validators.create), controller.create);
router.get("/:id", authenticate, passwordChangeGuard, validateRequest(validators.getById), controller.getById);
router.patch("/:id/status", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.updateStatus), controller.updateStatus);
router.put("/:id/status", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.updateStatus), controller.updateStatus);
router.post("/:id/fulfill", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.fulfill), controller.fulfill);

module.exports = router;
