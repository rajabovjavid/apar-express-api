const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  traveler: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  departure_date: {
    type: Date,
    required: true,
  },
  arrival_date: {
    type: Date,
    required: true,
  },
  deadline_date: {
    type: Date,
    required: true,
  },
  transport_type: {
    type: String,
    required: true,
  },
  max_weight: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  price_per_kg: {
    type: Number,
    required: true,
  },
  is_active: {
    type: Boolean,
    required: true,
  },
  earning: {
    type: Number,
    required: true,
  },
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
