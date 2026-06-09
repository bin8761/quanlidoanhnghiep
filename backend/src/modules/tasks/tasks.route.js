const express = require("express");
const controller = require("./tasks.controller");
const authenticate = require("../../middlewares/authenticate");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");

const router = express.Router();

router.get("/", authenticate, passwordChangeGuard, controller.getMyTasks);

module.exports = router;
