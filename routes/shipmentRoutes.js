const express = require("express");
const authController = require("../controllers/authController");
const shipmentController = require("../controllers/shipmentController");
const s3Controller = require("../controllers/s3Controller");
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
router.route("/signedUrl").get(s3Controller.getSignedUrl);

module.exports = router;
