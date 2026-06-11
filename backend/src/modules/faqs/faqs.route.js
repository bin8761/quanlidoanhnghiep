const express = require("express");
const controller = require("./faqs.controller");
const validators = require("./faqs.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.use(authenticate, passwordChangeGuard);

// Public (to logged in users) endpoints
router.get("/", controller.list);
router.get("/categories", controller.getCategories);
router.get("/:id", validateRequest(validators.getById), controller.getOne);

// Admin-only endpoints
router.post("/", authorize(ADMIN), validateRequest(validators.create), controller.create);
router.put("/:id", authorize(ADMIN), validateRequest(validators.update), controller.update);
router.delete("/:id", authorize(ADMIN), validateRequest(validators.getById), controller.delete);

module.exports = router;
