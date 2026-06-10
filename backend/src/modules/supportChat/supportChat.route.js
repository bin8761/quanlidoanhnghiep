const express = require("express");
const controller = require("./supportChat.controller");
const validators = require("./supportChat.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(passwordChangeGuard);

// --- Employee Routes ---
router.post(
  "/messages",
  validateRequest(validators.sendMessage),
  controller.sendMessage,
);

router.get(
  "/messages",
  controller.getMessages,
);

// --- Admin Routes ---
router.get(
  "/admin/sessions",
  authorize(ADMIN),
  controller.listSessionsForAdmin,
);

router.get(
  "/admin/sessions/:sessionId/messages",
  authorize(ADMIN),
  validateRequest(validators.getSessionMessages),
  controller.getSessionDetailsForAdmin,
);

router.post(
  "/admin/sessions/:sessionId/messages",
  authorize(ADMIN),
  validateRequest(validators.sendMessage), // body validation is same
  controller.sendAdminMessage,
);

router.put(
  "/admin/sessions/:sessionId/close",
  authorize(ADMIN),
  validateRequest(validators.updateStatus), // using updateStatus validator since it validates sessionId
  controller.closeSession,
);

module.exports = router;
