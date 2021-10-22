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

router.route("/users").get(adminController.getAllUsers);

router
  .route("/users/:id")
  .get(adminController.getUser)
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

router
  .route("/cities")
  .get(adminController.getAllCities)
  .post(adminController.createCity);

router.route("/cities/:id").get(adminController.getCity);

router.route("/cities/:id/addDistance").patch(adminController.addDistance);

module.exports = router;
