const express = require("express");
const categoriesController = require("./categories.controller");
const categoriesValidators = require("./categories.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.get(
  "/",
  authenticate,
  passwordChangeGuard,
  categoriesController.listCategories,
);

router.get(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(categoriesValidators.getById),
  categoriesController.getCategory,
);

router.post(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(categoriesValidators.create),
  categoriesController.createCategory,
);

router.put(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(categoriesValidators.update),
  categoriesController.updateCategory,
);

router.delete(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(categoriesValidators.delete),
  categoriesController.deleteCategory,
);

module.exports = router;
