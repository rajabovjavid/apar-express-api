const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    phone_number: {
      type: String,
      unique: true,
    },
    name_surname: {
      type: String,
      required: [true, "Please tell us your name and surname!"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      immutable: (doc) => doc.role !== "ADMIN",
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    image: {
      type: String,
      default: "default.jpg",
    },
    id_card: {
      type: String,
    },
    verification: {
      type: String,
      required: true,
      default: "Not Uploaded",
      enum: ["Not Uploaded", "Uploaded", "Verified"],
    },
    social_accounts: {
      facebook: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
    },
    promo: {
      code: {
        type: String,
        default: "",
      },
      link: {
        type: String,
        default: "",
      },
    },
    traveler: {
      number_of_trips: {
        type: Number,
        required: true,
        default: 0,
      },
      number_of_completed_trips: {
        type: Number,
        required: true,
        default: 0,
      },
      ratings_average: {
        type: Number,
        required: true,
        default: 1,
        min: [1, "Rating must be above 1.0"],
        max: [5, "Rating must be below 5.0"],
        set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
      },
      ratings_quantity: {
        type: Number,
        required: true,
        default: 0,
      },
      is_partner: {
        type: Boolean,
        required: true,
        default: false,
      },
      bank_account: {
        bank_name: {
          type: String,
          default: "",
        },
        iban: {
          type: String,
          default: "",
        },
        swift: {
          type: String,
          default: "",
        },
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual populate
userSchema.virtual("shipments", {
  ref: "Shipment",
  foreignField: "sender",
  localField: "_id",
});
userSchema.virtual("trips", {
  ref: "Trip",
  foreignField: "traveler",
  localField: "_id",
});

userSchema.pre(/^findOne/, function (next) {
  this.populate({
    path: "shipments",
    select: "-createdAt -updatedAt",
  }).populate({
    path: "trips",
    select: "-createdAt -updatedAt",
  });
  next();
});

// hashing password before saving user
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// updating passwordChangedAt field before saving user
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// whether entered password correct or not
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// whether password changed after jwt
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
