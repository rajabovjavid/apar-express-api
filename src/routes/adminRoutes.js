const express = require("express");
const userController = require("../controllers/userController");
const tripController = require("../controllers/tripController");
const shipmentController = require("../controllers/shipmentController");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const { sendResponse } = require("../controllers/handlerFactory");
// const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

// login required for below
router.use(authController.protect);

router
  .route("/calculatePrice")
  .post(tripController.calculatePricePerKg, sendResponse);

router.route("/cities").get(adminController.getAllCities, sendResponse);
router
  .route("/item-categories")
  .get(adminController.getAllItemCategories, sendResponse);

// only admins can reach below
router.use(authController.restrictTo("admin"));

// user related routes
router.route("/users").get(userController.getAllUsers, sendResponse);
router
  .route("/users/:id")
  .get(userController.beforeGetUser, userController.getUser, sendResponse);
// .patch(userController.updateUser)
// .delete(userController.deleteUser);
router.route("/users/:id/verification/verifyImage").patch((req, res, next) => {
  req.user = { id: req.params.id };
  next();
}, userController.verifyImage);

// shipment related routes
router
  .route("/shipments")
  .get(shipmentController.getAllShipments, sendResponse);

// user related routes
router.route("/trips").get(tripController.getAllTrips, sendResponse);
router
  .route("/trips/:id")
  .get(tripController.beforeGetTrip, tripController.getTrip, sendResponse);
// .patch(tripController.updateTrip)
// .delete(tripController.deleteTrip);

// city related routes
router.route("/cities").post(adminController.createCity, sendResponse);
router.route("/cities/:id").get(adminController.getCity, sendResponse);
router.route("/cities/:id/addDistance").patch(adminController.addDistance);
router.route("/cities/:id/addDistricts").patch(adminController.addDistricts);

// item category related routes
router
  .route("/item-categories")
  .post(adminController.createItemCategory, sendResponse);
router
  .route("/item-categories/:id")
  .get(adminController.getItemCategory, sendResponse);

// status related routes
router.route("/status").post(adminController.createStatus, sendResponse);

module.exports = router;
