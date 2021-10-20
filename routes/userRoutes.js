const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
// const uploadController = require("../controllers/uploadController");
const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);
router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);

// router.get("/uploadImage", uploadController.uploadUserImage);
// router.get("/uploadIdImage", uploadController.uploadUserIdImage);
router.get("/signedUrl", s3Controller.getSignedUrl);

router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
