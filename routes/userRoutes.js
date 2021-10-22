const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const s3Controller = require("../controllers/s3Controller");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// login required for below
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);

router.get("/signedUrl", s3Controller.getSignedUrl);

module.exports = router;
