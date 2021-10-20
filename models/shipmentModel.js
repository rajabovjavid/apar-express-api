const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
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
  package: {
    category: {
      type: String,
      required: true,
      enum: ["kitab", "sened", "yemek", "başqa"],
    },
    details: {
      type: String,
    },
    weight: {
      type: String,
      required: true,
    },
    images: {
      type: String,
      // required: true,
    },
  },
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
  totalPrice: {
    type: Number,
    required: true,
  },
});

const Shipment = mongoose.model("Shipment", shipmentSchema);

module.exports = Shipment;
