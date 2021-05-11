const fs = require("fs");
const util = require("util");

const unlinkFile = util.promisify(fs.unlink);

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const multerUpload = require("../utils/multerUpload");
const storeFile = require("../utils/s3");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.uploadImage = multerUpload.single("image");

exports.uploadIdCard = multerUpload.single("id_card");

exports.storeImage = catchAsync(async (req, res, next) => {
  await storeFile(req.file);
  await unlinkFile(req.file.path);
  next();
});

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
  const filteredBody = filterObj(req.body, "email", "name_surname");
  if (req.file.fieldname === "image") {
    filteredBody.image = req.file.filename;
    if (req.user.id_card) filteredBody.verification = "Uploaded";
  } else if (req.file.fieldname === "id_card") {
    filteredBody.id_card = req.file.filename;
    if (req.user.image) filteredBody.verification = "Uploaded";
  }

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

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
