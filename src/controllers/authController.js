const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const twilio = require("../utils/twilio");
const constants = require("../utils/constants");
const { createCustomer } = require("./stripeController");

const createJwtToken = (req) => {
  const { user } = req;
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const tokenExpireDate = new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  );

  /* res.cookie("jwt", token, {
    expires: tokenExpireDate,
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  }); */

  req.res_data.data = {
    user,
    token,
    tokenExpireDate,
  };
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name_surname: req.body.name_surname,
    email: req.body.email,
    phone_number: req.body.phone_number,
    password: req.body.password,
  });

  req.res_data = {
    status_code: 201,
    status: "success",
    messages: ["user created successfully"],
  };

  try {
    await new Email(newUser).sendWelcome();
  } catch (error) {
    req.res_data.messages.push("welcome email couldn't be sent");
  }

  const emailVerificationUrl = await newUser.sendEmailVerification(
    req.protocol,
    req.get("host")
  );
  if (!emailVerificationUrl) {
    req.res_data.messages.push(
      "There was an error sending the email. Try again later!"
    );
  }
  await newUser.save();

  const stripe_customer = await createCustomer(newUser);
  if (!stripe_customer) {
    req.res_data.messages.push(
      "There was an error creating stripe customer account. Try again later!"
    );
  }
  newUser.stripe_customer = stripe_customer;
  await newUser.save();

  newUser.password = undefined;
  req.user = newUser;
  createJwtToken(req);

  next();
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, phone_number, password } = req.body;

  // 1) Check if email/phone_number and password exist
  if (!password) {
    return next(new AppError("Please provide password!", 400));
  }
  if (!email && !phone_number) {
    return next(new AppError("Please provide email or phone number!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({
    $or: [{ email }, { phone_number }],
  }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  user.password = undefined;
  req.user = user;

  req.res_data = {
    status_code: 200,
    status: "success",
    messages: ["user logged in successfully"],
  };

  createJwtToken(req);

  next();
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success", data: { token: "" } });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    req.admin = req.user;

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createToken("password_reset");
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword?t=${resetToken}`;
    await new Email(user).sendPasswordReset(resetURL);

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.token.password_reset_token = undefined;
    user.token.password_reset_expires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    "token.password_reset_token": hashedToken,
    "token.password_reset_expires": { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.token.password_reset_token = undefined;
  user.token.password_reset_expires = undefined;
  await user.save();

  user.password = undefined;
  req.user = user;

  req.res_data = {
    status_code: 200,
    status: "success",
  };

  // TODO: Update changedPasswordAt property for the user

  createJwtToken(req);

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  user.password = undefined;
  req.user = user;

  req.res_data = {
    status_code: 200,
    status: "success",
  };

  createJwtToken(req);

  next();
});

exports.sendEmailVerification = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const emailVerificationUrl = await user.sendEmailVerification(
    req.protocol,
    req.get("host")
  );

  if (!emailVerificationUrl) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }

  await user.save();

  req.res_data = {
    status_code: 200,
    status: "success",
    messages: ["Verification URL sent to email"],
    data: {
      urlSentToEmail:
        process.env.NODE_ENV === "development"
          ? emailVerificationUrl
          : "url sent to your email",
    },
  };

  next();
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    "token.email_verification_token": hashedToken,
    // "token.email_verification_expires": { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid", 400));
  }

  if (user.token.email_verification_expires < Date.now()) {
    user.verification.email = constants.email.expired;
    await user.save();
    return next(new AppError("Token has expired", 400));
  }

  user.verification.email = constants.email.verified;
  user.token.email_verification_token = undefined;
  user.token.email_verification_expires = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "email verified",
  });
});

exports.sendSmsVerification = catchAsync(async (req, res, next) => {
  if (req.user.phone_number !== req.body.phone_number) {
    return next(
      new AppError("phone number doesn't match one you entered at signup", 400)
    );
  }
  const twilioRes = await twilio.sendSmsVerification(req.user.phone_number);

  // TODO: prepare proper response
  res.status(200).json({ twilioRes });
});

exports.checkSmsVerification = catchAsync(async (req, res, next) => {
  const twilioRes = await twilio.checkSmsVerification(
    req.user.phone_number,
    req.body.code
  );

  if (twilioRes.status !== "approved") {
    return next(new AppError("Code is invalid or has expired", 400));
  }
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: { "verification.phone_number": constants.phone.verified },
    },
    {
      runValidators: true,
    }
  );
  // TODO: prepare proper response
  res.status(200).json({ twilioRes });
});
