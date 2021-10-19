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
    // enum: ["Gəncə", "Bakı"],
  },
  destination: {
    type: String,
    required: true,
    // enum: ["Gəncə", "Bakı"],
  },
  pickup_deadline: {
    type: Date,
    required: true,
  },
  delivery_deadline: {
    type: Date,
    required: true,
  },
  max_weight: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  calculated_price_per_kg: {
    type: Number,
    required: true,
  },
  price_per_kg: {
    type: Number,
    required: true,
  },
  is_active: {
    type: Boolean,
    required: true,
    default: true,
  },
  earning: {
    type: Number,
    required: true,
    default: 0,
  },
});

tripSchema.pre(/^find/, function (next) {
  this.populate({
    path: "traveler",
    select:
      "traveler.total_rating traveler.number_of_completed_trips traveler.number_of_trips",
  });
  next();
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
