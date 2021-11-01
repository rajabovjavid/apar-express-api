const express = require("express");
const tripController = require("../controllers/tripController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(tripController.beforeGetAllTrips, tripController.getAllTrips); // for TripListScreen
router.route("/:id").get(tripController.beforeGetTrip, tripController.getTrip);

// only signedIn users
router.use(authController.protect);
// only verified users
router.use(userController.isVerified);

router
  .route("/")
  .post(
    tripController.calculatePricePerKg,
    tripController.beforeCreateTrip,
    tripController.createTrip
  );
router
  .route("/:id")
  .patch(tripController.updateTrip)
  .delete(tripController.deleteTrip);

module.exports = router;
