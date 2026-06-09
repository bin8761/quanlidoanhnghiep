const express = require("express");
const assetsController = require("./assets.controller");
const assetsValidators = require("./assets.validator");
const validateRequest = require("../../middlewares/validateRequest");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const passwordChangeGuard = require("../../middlewares/passwordChangeGuard");
const { uploadSingleImage } = require("../../middlewares/upload");
const { ADMIN } = require("../../shared/constants/roles");

const router = express.Router();

router.post(
  "/upload",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  uploadSingleImage("image"),
  assetsController.uploadAssetImage,
);

router.get(
  "/",
  authenticate,
  passwordChangeGuard,
  assetsController.listAssets,
);

router.get(
  "/:id",
  authenticate,
  passwordChangeGuard,
  validateRequest(assetsValidators.getById),
  assetsController.getAsset,
);

router.post(
  "/",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(assetsValidators.create),
  assetsController.createAsset,
);

router.put(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(assetsValidators.update),
  assetsController.updateAsset,
);

router.delete(
  "/:id",
  authenticate,
  passwordChangeGuard,
  authorize(ADMIN),
  validateRequest(assetsValidators.delete),
  assetsController.deleteAsset,
);

module.exports = router;
