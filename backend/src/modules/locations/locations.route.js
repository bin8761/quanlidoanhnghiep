const express = require("express");
const locationsController = require("./locations.controller");
const locationsValidators = require("./locations.validator");
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
  locationsController.listLocations,
);

router.get(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(locationsValidators.getById),
  locationsController.getLocation,
);

router.post(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(locationsValidators.create),
  locationsController.createLocation,
);

router.put(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(locationsValidators.update),
  locationsController.updateLocation,
);

router.delete(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(locationsValidators.delete),
  locationsController.deleteLocation,
);

module.exports = router;
