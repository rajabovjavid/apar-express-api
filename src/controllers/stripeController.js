const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const queryString = require("query-string");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { fee_percentage } = require("../utils/constants");
const User = require("../models/userModel");
const Shipment = require("../models/shipmentModel");

exports.createConnectAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // if user don't have stripe_account_id yet, create now
  if (!user.stripe_account) {
    const account = await stripe.accounts.create({
      type: req.body.type === "standart" ? "standart" : "express",
      email: user.email,
    });

    user.traveler.stripe_account = account;
    await user.save();
  }

  // create link based on account id (for frontend to complete onboarding)
  let accountLink = await stripe.accountLinks.create({
    account: user.traveler.stripe_account.id,
    refresh_url: process.env.STRIPE_REDIRECT_URL,
    return_url: process.env.STRIPE_REDIRECT_URL,
    type: "account_onboarding",
  });
  // prefill any info such as email
  accountLink = Object.assign(accountLink, {
    "stripe_user[email]": user.email,
  });

  const setup_link = `${accountLink.url}?${queryString.stringify(accountLink)}`;

  req.res_data = {
    status_code: 201,
    status: "success",
    data: {
      setup_link,
    },
  };

  next();
});

/* const updateDelayDays = async (accountId) => {
  const account = await stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          delay_days: 7,
        },
      },
    },
  });
  return account;
}; */

exports.getConnectAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const account = await stripe.accounts.retrieve(
    user.traveler.stripe_account.id
  );
  // update delay days
  // const updatedAccount = await updateDelayDays(account.id);
  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    {
      "traveler.stripe_account": account,
    },
    { new: true }
  );

  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      stripe_account: updatedUser.traveler.stripe_account,
    },
  };

  next();
});

exports.getAccountBalance = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const balance = await stripe.balance.retrieve({
    stripeAccount: user.traveler.stripe_account.id,
  });

  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      balance,
    },
  };

  next();
});

exports.getLoginLink = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const login_link = await stripe.accounts.createLoginLink(
    user.traveler.stripe_account.id,
    {
      redirect_url: process.env.STRIPE_SETTING_REDIRECT_URL,
    }
  );

  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      login_link,
    },
  };

  next();
});

const createCustomer = async (user) => {
  const stripe_customer = await stripe.customers.create({
    email: user.email,
    name: user.name_surname,
    phone: user.phone_number,
  });

  return stripe_customer;
};

module.exports.createCustomer = createCustomer;

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // find shipment
  const shipment = await Shipment.findById(req.body.shipment).populate({
    path: "trip",
    populate: { path: "traveler", select: "traveler.stripe_account" },
  });

  if (user.id !== shipment.sender.toString()) {
    return next(new AppError("You are not owner of this shipment", 401));
  }

  // charge as application fee
  const fee = (shipment.total_price * fee_percentage) / 100;
  // create a session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: shipment.id,
    customer: user.stripe_customer.id,
    payment_method_types: ["card"],
    // shipment details, it will be shown to user on checkout
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Shipment",
            description: `Shipment from ${shipment.trip.origin} to ${shipment.trip.destination}, pickup deadline: ${shipment.trip.pickup_deadline}, delivery deadline: ${shipment.trip.delivery_deadline}, package weight: ${shipment.package.weight}kg`,
          },
          unit_amount: shipment.total_price * 100, // in cents
        },
        quantity: 1,
      },
    ],
    // create payment intent with application fee and destination charge
    payment_intent_data: {
      application_fee_amount: fee * 100,
      transfer_data: {
        destination: shipment.trip.traveler.traveler.stripe_account.id,
      },
    },
    // success and calcel urls
    success_url: process.env.STRIPE_SUCCESS_URL, //shipment.id
    cancel_url: process.env.STRIPE_CANCEL_URL,
  });

  // add this session object to user
  await User.findByIdAndUpdate(req.user.id, { stripe_session: session });
  // send session id as resposne to frontend
  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      checkout_url: session.url,
    },
  };

  next();
});
