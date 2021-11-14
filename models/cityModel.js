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

const DistrictSchema = new mongoose.Schema(
  {
    district_name: {
      type: String,
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
    country: {
      type: String,
      required: true,
    },
    distances_to: [DistanceToSchema],
    districts: [DistrictSchema],
  },
  { timestamps: true }
);

const City = mongoose.model("City", citySchema);

module.exports = City;
