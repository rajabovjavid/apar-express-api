const express = require("express");
// const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
// const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

// login required for below
router.use(authController.protect);
// only admins can reach below
router.use(authController.restrictTo("admin"));

// user related routes
router.route("/users").get(adminController.getAllUsers);
router
  .route("/users/:id")
  .get(adminController.getUser)
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

// city related routes
router
  .route("/cities")
  .get(adminController.getAllCities)
  .post(adminController.createCity);
router.route("/cities/:id").get(adminController.getCity);
router.route("/cities/:id/addDistance").patch(adminController.addDistance);

// shipment related routes
router.route("/shipments").get(adminController.getAllShipments);

module.exports = router;
