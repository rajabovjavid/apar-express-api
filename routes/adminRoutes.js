const express = require("express");
const userController = require("../controllers/userController");
const tripController = require("../controllers/tripController");
const shipmentController = require("../controllers/shipmentController");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
// const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

// login required for below
router.use(authController.protect);

router
  .route("/calculatePrice")
  .get(tripController.calculatePricePerKg, (req, res) => {
    res.status(200).json({
      status: "success",
      data: {
        calculatedPrice: req.body.calculated_price_per_kg,
      },
    });
  });

// only admins can reach below
router.use(authController.restrictTo("admin"));

// user related routes
router.route("/users").get(userController.getAllUsers);
router
  .route("/users/:id")
  .get(userController.beforeGetUser, userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// shipment related routes
router.route("/shipments").get(shipmentController.getAllShipments);

// user related routes
router.route("/trips").get(tripController.getAllTrips);
router
  .route("/trips/:id")
  .get(tripController.beforeGetTrip, tripController.getTrip)
  .patch(tripController.updateTrip)
  .delete(tripController.deleteTrip);

// city related routes
router
  .route("/cities")
  .get(adminController.getAllCities)
  .post(adminController.createCity);
router.route("/cities/:id").get(adminController.getCity);
router.route("/cities/:id/addDistance").patch(adminController.addDistance);

module.exports = router;
