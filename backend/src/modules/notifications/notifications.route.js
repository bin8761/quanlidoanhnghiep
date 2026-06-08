const express = require("express");
const controller = require("./notifications.controller");
const authenticate = require("../../middlewares/authenticate");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");

const router = express.Router();

router.get("/", authenticate, passwordChangeGuard, controller.list);
router.get("/unread-count", authenticate, passwordChangeGuard, controller.unreadCount);
router.get("/stream", controller.stream);
router.patch("/read-all", authenticate, passwordChangeGuard, controller.markAllAsRead);
router.patch("/:id/read", authenticate, passwordChangeGuard, controller.markAsRead);

module.exports = router;
