const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    traveler: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    traveler_ratings_average: {
      // TODO - need to update very
      type: Number,
      required: true,
      default: 0,
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual populate
tripSchema.virtual("shipments", {
  ref: "Shipment",
  foreignField: "trip",
  localField: "_id",
});

tripSchema.pre(/^findOne/, function (next) {
  this.populate({
    path: "traveler",
    select:
      "traveler.ratings_average traveler.ratings_quantity traveler.number_of_completed_trips traveler.number_of_trips",
  }).populate({
    path: "shipments",
    select: "-createdAt -updatedAt",
  });
  next();
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
