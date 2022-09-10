const express = require("express");
const stripeController = require("../controllers/stripeController");
const authController = require("../controllers/authController");
const { sendResponse } = require("../controllers/handlerFactory");

const router = express.Router();

router.route("/redirect").get((req, res) => {
  res.send("these should redirect back to app");
});

// login required for below
router.use(authController.protect);

router
  .route("/account")
  .get(stripeController.getConnectAccount, sendResponse)
  .post(stripeController.createConnectAccount, sendResponse);

router
  .route("/account-balance")
  .get(stripeController.getAccountBalance, sendResponse);

router.route("/account-login").get(stripeController.getLoginLink, sendResponse);

// router.route("/customer").post(stripeController.createCustomer, sendResponse);

router
  .route("/checkout-session")
  .post(stripeController.createCheckoutSession, sendResponse);

module.exports = router;
