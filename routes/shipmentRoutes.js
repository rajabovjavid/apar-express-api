const express = require("express");
const authController = require("../controllers/authController");
const shipmentController = require("../controllers/shipmentController");
const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

// only signedIn users
router.use(authController.protect);

router.route("/").post(shipmentController.createShipment);

router.route("/signedUrl").get(s3Controller.getSignedUrl);

router
  .route("/my-shipments")
  .get(shipmentController.getMyShipments, shipmentController.getAllShipments);

router.route("/").get(shipmentController.getAllShipments);

module.exports = router;
