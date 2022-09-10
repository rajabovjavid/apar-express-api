const mongoose = require("mongoose");
// const validator = require("validator");

const tripSchema = new mongoose.Schema(
  {
    traveler: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    traveler_ratings_average: {
      // TODO: - need to update very
      type: Number,
      required: true,
      default: 0,
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    ori_districts: [{ type: String, required: true }],
    dest_districts: [{ type: String, required: true }],
    region: {
      type: String,
      required: true,
      enum: ["local", "global"],
      default: "local",
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
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "PackageCategory",
        required: true,
      },
    ],
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
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (val) {
          return val <= this.calculated_price_per_kg;
        },
        message: "price should be less or equal than calculated price",
      },
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual populate
tripSchema.virtual("shipments", {
  ref: "Shipment",
  foreignField: "trip",
  localField: "_id",
});

tripSchema.pre(/^find/, function (next) {
  this.populate({
    path: "categories",
  });
  next();
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
