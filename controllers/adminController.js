const City = require("../models/cityModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// user related operations

// shipment related operations

// trip related operations

// city related operations
exports.createCity = factory.createOne(City);
exports.getCity = factory.getOne(City);
exports.getAllCities = factory.getAll(City);

exports.addDistance = catchAsync(async (req, res, next) => {
  const city1 = await City.findById(req.params.id);
  if (!city1) {
    return next(new AppError("No city found with that ID", 404));
  }

  const city2 = await City.findOne({ city_name: req.body.to_city_name });
  if (!city2) {
    return next(
      new AppError(`No city found with name ${req.body.to_city_name}`, 404)
    );
  }

  const to_city1 = city1.distances_to.find(
    (item) => item.to_city_name === city2.city_name
  );
  const to_city2 = city2.distances_to.find(
    (item) => item.to_city_name === city1.city_name
  );
  if (!to_city1) {
    city1.distances_to.push({
      to_city_name: city2.city_name,
      distance: req.body.distance,
    });
    city2.distances_to.push({
      to_city_name: city1.city_name,
      distance: req.body.distance,
    });
  } else {
    to_city1.distance = req.body.distance;
    to_city2.distance = req.body.distance;
  }
  const updatedCity1 = await city1.save();
  // eslint-disable-next-line no-unused-vars
  const updatedCity2 = await city2.save();

  res.status(200).json({
    status: "success",
    data: {
      city: updatedCity1,
    },
  });
});

exports.addDistricts = catchAsync(async (req, res, next) => {
  const districts = req.body.districts.map((item) => ({ district_name: item }));
  const updatedCity = await City.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        districts: { $each: districts },
      },
    },
    { new: true }
  );
  res.status(201).json({
    status: "success",
    city: updatedCity,
  });
});
