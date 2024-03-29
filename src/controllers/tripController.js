const Trip = require("../models/tripModel");
const City = require("../models/cityModel");
const ItemCategory = require("../models/itemCategoryModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const constants = require("../utils/constants");
const factory = require("./handlerFactory");

exports.beforeCreateTrip = catchAsync(async (req, res, next) => {
  // origin districts check
  if (!req.body.ori_districts?.length) {
    // if body.ori_districts is undefined or empty
    req.body.ori_districts = req.originCity.districts;
  } else if (
    // if body.ori_districts isn't subarray of originCity.districts
    !req.body.ori_districts.every((val) =>
      req.originCity.districts.includes(val)
    )
  ) {
    return next(new AppError(`Unsupported origin district`, 404));
  }

  // destination districts check
  if (!req.body.dest_districts?.length) {
    // if body.dest_districts is undefined or empty
    req.body.dest_districts = req.destinationCity.districts;
  } else if (
    // if body.dest_districts isn't subarray of destinationCity.districts
    !req.body.dest_districts.every((val) =>
      req.destinationCity.districts.includes(val)
    )
  ) {
    return next(new AppError(`Unsupported destination district`, 404));
  }

  // categories check
  if (req.body.categories?.length) {
    // eslint-disable-next-line no-unused-vars
    const categories = await ItemCategory.find().select("id");
    req.body.categories.forEach((category) => {
      if (!categories.some((c) => c.id === category)) {
        return next(new AppError(`Unsupported category`, 404));
      }
    });
  }

  // assignin remaining parts
  req.body.traveler = req.user._id;
  req.body.traveler_ratings_average = req.user.traveler.ratings_average;
  req.body.pickup_deadline = new Date(req.body.pickup_deadline);
  req.body.delivery_deadline = new Date(req.body.delivery_deadline);

  next();
});

exports.calculatePricePerKg = catchAsync(async (req, res, next) => {
  // distance
  const originCity = await City.findOne({ city_name: req.body.origin });
  if (!originCity) {
    return next(
      new AppError(`No city found with name ${req.body.origin}`, 404)
    );
  }
  const destinationCity = await City.findOne({
    city_name: req.body.destination,
  });
  if (!destinationCity) {
    return next(
      new AppError(`No city found with name ${req.body.destination}`, 404)
    );
  }
  const { distance } = originCity.distances_to.find(
    (item) => item.to_city_name === destinationCity.city_name
  );

  // shipping duration
  const pickup_deadline = new Date(req.body.pickup_deadline);
  const delivery_deadline = new Date(req.body.delivery_deadline);
  const diffTime = Math.abs(delivery_deadline - pickup_deadline);
  const diffInHours = Math.ceil(diffTime / (1000 * 60 * 60));

  // setting region
  req.body.region =
    originCity.country === destinationCity.country ? "local" : "global";

  // setting coefficient
  const regionCoefficient =
    req.body.region === "local"
      ? constants.localCoefficient
      : constants.globalCoefficient;

  // final formula
  const calculatedValue = (distance / diffInHours) * regionCoefficient;
  req.body.calculated_price_per_kg = Math.round(calculatedValue * 10) / 10;

  // assign cities to requests
  req.originCity = originCity;
  req.destinationCity = destinationCity;

  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      calculatedPrice: req.body.calculated_price_per_kg,
    },
  };

  next();
});

// for public use (search trip action)
exports.beforeGetAllTrips = (req, res, next) => {
  const pickup_deadline = {};
  pickup_deadline.gte = req.query.pickup_deadline || new Date();
  if (req.query.pickup_deadline) {
    const date = new Date(req.query.pickup_deadline);
    pickup_deadline.lte = date.setUTCHours(23, 59, 59, 999); // end of the date
  }

  req.body.popOptions = [
    {
      path: "traveler",
      select:
        "traveler.ratings_average traveler.ratings_quantity traveler.number_of_trips traveler.number_of_completed_trips",
    },
  ];

  req.query = {
    ...req.query,
    is_active: "true",
    pickup_deadline,
    fields: "-description,-is_active,-earning,-createdAt,-updatedAt",
    sort: "pickup_deadline,-traveler_ratings_average",
  };

  next();
};

exports.beforeGetTrip = (req, res, next) => {
  if (!req.query.populate) return next();

  const popOptions = [];
  const popFields = req.query.populate.split(",").join(" ");

  if (popFields.includes("shipments")) {
    popOptions.push({
      path: "shipments",
      select: "-createdAt -updatedAt",
    });
  }
  if (popFields.includes("traveler")) {
    popOptions.push({
      path: "traveler",
      select:
        "-role -promo -stripe_customer -traveler.stripe_account -token -passwordChangedAt -createdAt -updatedAt",
    });
  }
  if (popOptions.length > 0) req.body.popOptions = popOptions;
  next();
};

exports.isOwner = catchAsync(async (req, res, next) => {
  const traveler = req.res_data.data.trip.traveler.toString();
  if (req.user.id !== traveler) {
    return next(new AppError("You are not owner of this trip", 401));
  }
  next();
});

exports.beforeGetMyTrip = (req, res, next) => {
  req.body.popOptions = [
    {
      path: "shipments",
      select: "-createdAt -updatedAt -receiver_number",
    },
  ];

  req.query.fields = "-traveler_ratings_average,-createdAt,-updatedAt";

  next();
};

exports.getTrip = factory.getOne(Trip);
exports.getAllTrips = factory.getAll(Trip);
exports.createTrip = factory.createOne(Trip);
exports.updateTrip = factory.updateOne(Trip);
exports.deleteTrip = factory.deleteOne(Trip);
