const express = require("express");
const controller = require("./inventory.controller");
const validators = require("./inventory.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.get("/inventory-sessions", authenticate, passwordChangeGuard, validateRequest(validators.listSessions), controller.listSessions);
router.post("/inventory-sessions", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.createSession), controller.createSession);
router.get("/inventory-sessions/:id", authenticate, passwordChangeGuard, validateRequest(validators.getSession), controller.getSession);
router.put("/inventory-items/:id", authenticate, passwordChangeGuard, authorize(ADMIN), validateRequest(validators.updateItem), controller.updateItem);

module.exports = router;
