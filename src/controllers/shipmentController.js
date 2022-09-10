const Shipment = require("../models/shipmentModel");
const Trip = require("../models/tripModel");
const AppError = require("../utils/appError");

const catchAsync = require("../utils/catchAsync");
const s3 = require("../utils/s3");
// const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.createShipment = catchAsync(async (req, res) => {
  const {
    trip: trip_id,
    package_categories: categories,
    package_details: details,
    package_weight: weight,
    receiver_number,
    price_per_kg,
  } = req.body;

  // check whether trip's price_per_kg changed
  const trip = await Trip.findById(trip_id);
  if (trip.price_per_kg !== price_per_kg) {
    throw new AppError("Price per kg changed. Please try again.", 400);
  }

  // create shipment
  let shipment = await Shipment.create({
    sender: req.user.id,
    trip: trip_id,
    package: {
      categories,
      details,
      weight,
    },
    receiver_number,
    total_price: price_per_kg * weight,
    status: {
      status: "sender_requested",
      details:
        "sender müraciyetini tamamladıqdan sonra, shipment yaradılır ve statusu bu olur",
    },
  });

  // populate trip to shipment
  shipment = await Shipment.populate(shipment, {
    path: "trip",
    select: "origin destination pickup_deadline delivery_deadline traveler",
  });

  res.status(201).json({
    status: "success",
    data: {
      shipment,
    },
  });
});

exports.isOwner = catchAsync(async (req, res, next) => {
  const sender = req.res_data.data.shipment.sender.toString();
  if (req.user.id !== sender) {
    return next(new AppError("You are not owner of this shipment", 401));
  }
  next();
});

exports.getSignedUrlForPackage = catchAsync(async (req, res) => {
  // if there is many images in one package then?
  const key = `packages/${req.params.id}.jpeg`;

  const url = await s3.getSignedUrl(key, req.methodObject);

  res.send({ key, url });
});

exports.getShipment = factory.getOne(Shipment);
exports.getAllShipments = factory.getAll(Shipment);
