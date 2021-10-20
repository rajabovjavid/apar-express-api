const express = require("express");
const authController = require("../controllers/authController");
const shipmentController = require("../controllers/shipmentController");
const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

// only signedIn users
router.use(authController.protect);

router.route("/").post(shipmentController.createShipment);

router.route("/signedUrl").get(s3Controller.getSignedUrl);

module.exports = router;
