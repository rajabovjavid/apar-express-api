const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Shipment",
    },
    reliability: {
      type: Number,
      required: true,
    },
    behaviour: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
