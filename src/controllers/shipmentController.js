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
    item_categories,
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
  const shipment = await Shipment.create({
    sender: req.user.id,
    trip: trip_id,
    package: {
      items: item_categories.map((category) => ({ category })),
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

  // populate trip
  await shipment.populate({
    path: "trip",
    select: "origin destination pickup_deadline delivery_deadline traveler",
  });

  await shipment.populate({ path: "package.items.category" });

  // get signed url for each item
  const signedUrls = {};
  const { items } = shipment.package;
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, item] of items.entries()) {
    const key = `packages/${shipment._id}/${item.category.name}.jpeg`;
    // eslint-disable-next-line no-await-in-loop
    const url = await s3.getSignedUrl(key, "putObject");
    if (url) {
      shipment.package.items[index].image = key;
      signedUrls[item.category.name] = url;
    }
  }

  // save shipment package items images
  await shipment.save();

  res.status(201).json({
    status: "success",
    data: {
      shipment,
      signedUrls,
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

/* exports.getSignedUrlsForPackageItems = catchAsync(async (req, res) => {
  const shipment = new Shipment(req.res_data.data.shipment);

  // get signed url for each item
  const signedUrls = {};
  const { items } = shipment.package;
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, item] of items.entries()) {
    const key = `packages/${shipment._id}/${item.category.name}.jpeg`;
    // eslint-disable-next-line no-await-in-loop
    const url = await s3.getSignedUrl(key, req.query.s3method);
    if (url) {
      // eslint-disable-next-line dot-notation
      shipment.package.items[index]["image"] = key;
      signedUrls[item.category.name] = url;
    }
  }
}); */

exports.getShipment = factory.getOne(Shipment);
exports.getAllShipments = factory.getAll(Shipment);
