const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { sendResponse } = require("../controllers/handlerFactory");

const router = express.Router();

router.post("/signup", authController.signup, sendResponse);
router.post("/login", authController.login, sendResponse);
router.get("/logout", authController.logout);

router
  .route("/forgotPassword")
  .get((req, res) => {
    res.status(200).render("password-forgot");
  })
  .post(authController.forgotPassword);
router
  .route("/resetPassword")
  .get((req, res) => {
    res.status(200).render("password-reset", { token: req.query.t });
  })
  .post(authController.resetPassword, sendResponse);

router.get("/verification/verifyEmail/:token", authController.verifyEmail);

// login required for below
router.use(authController.protect);

router.post(
  "/verification/sendEmailVerification",
  authController.sendEmailVerification,
  sendResponse
);

router.post(
  "/verification/sendSmsVerification",
  authController.sendSmsVerification
);
router.post(
  "/verification/checkSmsVerification",
  authController.checkSmsVerification
);

router.patch("/updateMyPassword", authController.updatePassword);
router.get(
  "/me",
  userController.getMe,
  userController.beforeGetUser,
  userController.getUser,
  sendResponse
);
router.patch("/updateMe", userController.updateMe);

router.get(
  "/signedUrl/get",
  (req, res, next) => {
    if (req.query.user_id) req.user = { id: req.query.user_id };
    req.methodObject = "getObject";
    next();
  },
  userController.getSignedUrlForUser
);

router.get(
  "/signedUrl/put",
  (req, res, next) => {
    req.methodObject = "putObject";
    next();
  },
  userController.getSignedUrlForUser
);

router.patch(
  "/verification/verifyUpload",
  userController.verifyUpload,
  userController.verifyImage
);
module.exports = router;
