const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    req.res_data = {
      status_code: 200,
      status: "success",
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    };

    next();
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    req.res_data = {
      status_code: 201,
      status: "success",
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    };

    next();
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
      Model.findById(req.params.id),
      req.query
    ).limitFields();
    if (req.body.popOptions) features.populate(req.body.popOptions);
    const doc = await features.query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    req.res_data = {
      status_code: 200,
      status: "success",
      data: {
        [Model.modelName.toLowerCase()]: doc,
      },
    };

    next();
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    if (req.body.popOptions) features.populate(req.body.popOptions);
    const doc = await features.query;

    req.res_data = {
      status_code: 200,
      status: "success",
      data: {
        length: doc.length,
        [`${Model.modelName.toLowerCase()}s`]: doc,
      },
    };

    next();
  });

exports.sendResponse = (req, res) => {
  const { status_code, status, data, messages } = req.res_data;
  res.status(status_code).json({
    status,
    messages,
    data,
  });
};
