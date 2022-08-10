const express = require("express");
const tripController = require("../controllers/tripController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { sendResponse } = require("../controllers/handlerFactory");

const router = express.Router();

router
  .route("/")
  .get(
    tripController.beforeGetAllTrips,
    tripController.getAllTrips,
    sendResponse
  ); // for TripListScreen
router
  .route("/:id")
  .get(tripController.beforeGetTrip, tripController.getTrip, sendResponse);

// only signedIn users
router.use(authController.protect);
// only verified users
router.use(userController.isVerified);

router
  .route("/")
  .post(
    tripController.calculatePricePerKg,
    tripController.beforeCreateTrip,
    tripController.createTrip,
    sendResponse
  );

// only for owner of trip

router
  .route("/:id/me")
  .get(
    tripController.beforeGetMyTrip,
    tripController.getTrip,
    tripController.isOwner,
    sendResponse
  );
// .patch(tripController.updateTrip)
// .delete(tripController.deleteTrip);

module.exports = router;
