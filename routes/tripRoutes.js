const express = require("express");
const tripController = require("../controllers/tripController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

// only signedIn users
router.use(authController.protect);

router.route("/").get(tripController.getAllTrips);
router.route("/:id").get(tripController.getTrip);

// only verified users
router.use(userController.isVerified);

router
  .route("/")
  .post(tripController.calculatePricePerKg, tripController.createTrip);
router
  .route("/:id")
  .patch(tripController.updateTrip)
  .delete(tripController.deleteTrip);

module.exports = router;
