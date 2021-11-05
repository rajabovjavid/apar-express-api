const Shipment = require("../models/shipmentModel");

const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

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
      data: shipment,
    },
  });
});

exports.getShipment = factory.getOne(Shipment);
exports.getAllShipments = factory.getAll(Shipment);
