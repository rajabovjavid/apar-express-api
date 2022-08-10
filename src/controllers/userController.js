const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const s3 = require("../utils/s3");
const constants = require("../utils/constants");
const factory = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "email",
    "name_surname",
    "social_accounts"
  );

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.isVerified = (req, res, next) => {
  if (req.user.verification === "Not Uploaded") {
    return next(new AppError("You have to upload your image and id card", 403));
  }

  if (req.user.verification === "Uploaded") {
    return next(
      new AppError("Wait until admin verifies your image and id card", 403)
    );
  }

  next();
};

exports.beforeGetUser = (req, res, next) => {
  if (!req.query.populate) return next();

  const popOptions = [];
  const popFields = req.query.populate.split(",").join(" ");

  if (popFields.includes("trips")) {
    popOptions.push({
      path: "trips",
      select: "origin destination pickup_deadline delivery_deadline",
    });
  }
  if (popFields.includes("shipments")) {
    popOptions.push({
      path: "shipments",
      select: "status total_price",
      populate: {
        path: "trip",
        select: "origin destination pickup_deadline delivery_deadline traveler",
      },
    });
  }

  if (popOptions.length > 0) req.body.popOptions = popOptions;
  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getSignedUrlForUser = catchAsync(async (req, res, next) => {
  let key;
  if (req.query.key === "user_image") key = `user-images/${req.user.id}.jpeg`;
  else if (req.query.key === "user_id_image")
    key = `user-ids/${req.user.id}.jpeg`;
  else return next(new AppError("you can't get signed url for this", 400));

  const url = await s3.getSignedUrl(key, req.methodObject);

  res.send({ key, url });
});

exports.verifyUpload = catchAsync(async (req, res, next) => {
  let key;
  let updateObj;
  if (req.query.key === "user_image") {
    key = `user-images/${req.user.id}.jpeg`;
    updateObj = {
      "verification.image": constants.image.uploaded,
    };
  } else if (req.query.key === "user_id_image") {
    key = `user-ids/${req.user.id}.jpeg`;
    updateObj = {
      "verification.id_card": constants.image.uploaded,
    };
  } else return next(new AppError("specify the key", 400));

  if (!(await s3.isKeyExist(key))) {
    return next(new AppError("image not uploaded to s3", 400));
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: updateObj,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return next();

  // eslint-disable-next-line no-unreachable
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.verifyImage = catchAsync(async (req, res, next) => {
  let updateObj;
  if (req.query.key === "user_image") {
    updateObj = {
      "verification.image": constants.image.verified,
    };
  } else if (req.query.key === "user_id_image") {
    updateObj = {
      "verification.id_card": constants.image.verified,
    };
  } else return next(new AppError("specify the key", 400));

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: updateObj,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User); // Do NOT update passwords with this!
exports.deleteUser = factory.deleteOne(User);
