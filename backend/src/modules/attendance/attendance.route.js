const express = require("express");
const controller = require("./attendance.controller");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.use(authenticate, passwordChangeGuard);

router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);
router.get("/status", controller.getStatus);
router.get("/my-history", controller.getMyHistory);

// Admin only list
router.get("/all", authorize(ADMIN), controller.getAllHistory);

module.exports = router;
