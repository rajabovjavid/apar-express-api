const Trip = require("../models/tripModel");

const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.createTrip = catchAsync(async (req, res) => {
  const trip = await Trip.create({
    traveler: req.user._id,
    origin: req.body.origin,
    destination: req.body.destination,
    pickup_deadline: new Date(req.body.pickup_deadline),
    delivery_deadline: new Date(req.body.delivery_deadline),
    max_weight: req.body.max_weight,
    calculated_price_per_kg: req.body.calculated_price_per_kg,
    price_per_kg: req.body.calculated_price_per_kg,
    description: req.body.description,
  });

  res.status(201).json({
    status: "success",
    data: {
      data: trip,
    },
  });
});

exports.calculatePricePerKg = catchAsync(async (req, res, next) => {
  // 1) şeherler arasındakş mesafe

  //2) çatdırılma müddeti
  const pickup_deadline = new Date(req.body.pickup_deadline);
  const delivery_deadline = new Date(req.body.delivery_deadline);
  const diffTime = Math.abs(delivery_deadline - pickup_deadline);
  const diffInHours = Math.ceil(diffTime / (1000 * 60 * 60));

  // tez çatdırılmanın qiymeti daha çox olmalıdır TODO
  req.body.calculated_price_per_kg = diffInHours * 1;

  next();
});

exports.getTrip = factory.getOne(Trip);

exports.getAllTrips = factory.getAll(Trip);

exports.updateTrip = factory.updateOne(Trip);

exports.deleteTrip = factory.deleteOne(Trip);
