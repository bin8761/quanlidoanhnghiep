const express = require("express");
const multer = require("multer");
const controller = require("./feedbacks.controller");
const validators = require("./feedbacks.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

router.use(authenticate, passwordChangeGuard);

// User/Employee routes
router.post(
  "/",
  upload.single("file"),
  validateRequest(validators.create),
  controller.create,
);

router.get("/my", controller.listMy);

// Admin-only routes
router.get("/", authorize(ADMIN), controller.list);
router.get("/:id", authorize(ADMIN), validateRequest(validators.getById), controller.getOne);
router.patch(
  "/:id/status",
  authorize(ADMIN),
  validateRequest(validators.updateStatus),
  controller.updateStatus,
);

module.exports = router;
