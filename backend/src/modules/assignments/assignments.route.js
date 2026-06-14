const express = require("express");
const controller = require("./assignments.controller");
const validators = require("./assignments.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.get("/my", authenticate, passwordChangeGuard, controller.myAssignments);
router.get("/history/my", authenticate, passwordChangeGuard, controller.myHistory);
router.get("/history", authenticate, passwordChangeGuard, validateRequest(validators.history), controller.history);
router.post("/confirm", authenticate, passwordChangeGuard, validateRequest(validators.confirm), controller.confirm);
router.post("/assign", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.assign), controller.assign);
router.post("/return", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.return), controller.returnAsset);
router.post("/transfer", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.transfer), controller.transfer);

module.exports = router;
