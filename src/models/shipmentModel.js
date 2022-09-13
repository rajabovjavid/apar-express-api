const mongoose = require("mongoose");

const shipmentPackage = new mongoose.Schema(
  {
    items: [
      {
        category: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: "ItemCategory",
        },
        image: {
          type: String,
          // required: true,
        },
      },
    ],
    details: {
      type: String,
    },
    weight: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    trip: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Trip",
    },
    package: shipmentPackage,
    receiver_number: {
      type: String,
      required: true,
    },
    status: {
      status: {
        type: String,
        required: true,
      },
      details: {
        type: String,
      },
    },
    total_price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

shipmentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "package.items.category",
  });
  next();
});

const Shipment = mongoose.model("Shipment", shipmentSchema);

module.exports = Shipment;
