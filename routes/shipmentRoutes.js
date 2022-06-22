const express = require("express");
const authController = require("../controllers/authController");
const shipmentController = require("../controllers/shipmentController");
const { sendResponse } = require("../controllers/handlerFactory");

const router = express.Router();

// only signedIn users
router.use(authController.protect);

router.route("/").post(shipmentController.createShipment);

router
  .route("/:id/me")
  .get(
    shipmentController.getShipment,
    shipmentController.isOwner,
    sendResponse
  );
router.route("/:id/signedUrl/put").get(
  shipmentController.getShipment,
  shipmentController.isOwner,
  (req, res, next) => {
    req.methodObject = "putObject";
    next();
  },
  shipmentController.getSignedUrlForPackage
);

router.route("/:id/signedUrl/get").get((req, res, next) => {
  req.methodObject = "getObject";
  next();
}, shipmentController.getSignedUrlForPackage);

module.exports = router;
