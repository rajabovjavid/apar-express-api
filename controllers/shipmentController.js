const Shipment = require("../models/shipmentModel");
const AppError = require("../utils/appError");

const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const getSignedUrl = require("../utils/s3");

exports.createShipment = catchAsync(async (req, res) => {
  let shipment = await Shipment.create({
    sender: req.user.id,
    trip: req.body.trip,
    package: {
      category: req.body.package_category,
      details: req.body.package_details,
      weight: req.body.package_weight,
    },
    receiver_number: req.body.receiver_number,
    total_price: req.body.price_per_kg * req.body.package_weight,
    status: {
      status: "sender_requested",
      details:
        "sender müraciyetini tamamladıqdan sonra, shipment yaradılır ve statusu bu olur",
    },
  });

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

exports.getSignedUrlForPackage = catchAsync(async (req, res, next) => {
  // if there is many images in one package then?
  const key = `packages/${req.params.id}.jpeg`;

  const url = await getSignedUrl(key, req.methodObject);

  res.send({ key, url });
});

exports.getShipment = factory.getOne(Shipment);
exports.getAllShipments = factory.getAll(Shipment);
