const mongoose = require("mongoose");

const DistanceToSchema = new mongoose.Schema(
  {
    to_city_name: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const citySchema = new mongoose.Schema(
  {
    city_name: {
      type: String,
      required: true,
      unique: true,
    },
    distances_to: [DistanceToSchema],
  },
  { timestamps: true }
);

const City = mongoose.model("City", citySchema);

module.exports = City;
