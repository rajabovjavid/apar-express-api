const Trip = require("../models/tripModel");
const City = require("../models/cityModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const constants = require("../utils/constants");
const factory = require("./handlerFactory");

exports.beforeCreateTrip = catchAsync(async (req, res, next) => {
  req.body = {
    ...req.body,
    traveler: req.user._id,
    traveler_ratings_average: req.user.traveler.ratings_average,
    pickup_deadline: new Date(req.body.pickup_deadline),
    delivery_deadline: new Date(req.body.delivery_deadline),
  };
  next();
});

exports.calculatePricePerKg = catchAsync(async (req, res, next) => {
  // distance
  const originCity = await City.findOne({ city_name: req.body.origin });
  if (!originCity) {
    return next(new AppError("No city found with that name", 404));
  }
  const destinationCity = await City.findOne({
    city_name: req.body.destination,
  });
  if (!destinationCity) {
    return next(new AppError("No city found with that name", 404));
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

  // another change

  req.res_data = {
    status_code: 200,
    status: "success",
    data: {
      calculatedPrice: req.body.calculated_price_per_kg,
    },
  };
  // new change

  next();
});

// not for admin routes
exports.beforeGetAllTrips = (req, res, next) => {
  const pickup_deadline = {};
  pickup_deadline.gte = req.query.pickup_deadline || new Date();
  if (req.query.pickup_deadline) {
    const date = new Date(req.query.pickup_deadline);
    pickup_deadline.lte = date.setUTCHours(23, 59, 59, 999); // end of the date
  }

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
        "traveler.ratings_average traveler.ratings_quantity traveler.number_of_completed_trips traveler.number_of_trips",
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
