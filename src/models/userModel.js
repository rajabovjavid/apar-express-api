const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const constants = require("../utils/constants");
const Email = require("../utils/email");

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
    },
    id_card: {
      type: String,
    },
    verification: {
      email: {
        type: mongoose.Schema.ObjectId,
        default: constants.email.notsent,
        ref: "Status",
        required: true,
      },
      phone_number: {
        type: mongoose.Schema.ObjectId,
        default: constants.phone.notverified,
        ref: "Status",
        required: true,
      },
      image: {
        type: mongoose.Schema.ObjectId,
        default: constants.image.notuploaded,
        ref: "Status",
        required: true,
      },
      id_card: {
        type: mongoose.Schema.ObjectId,
        default: constants.image.notuploaded,
        ref: "Status",
        required: true,
      },
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
    stripe_customer: {},
    stripe_session: {},
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
      stripe_account: {},
    },
    token: {
      password_reset_token: {
        type: String,
      },
      password_reset_expires: {
        type: Date,
      },
      email_verification_token: {
        type: String,
      },
      email_verification_expires: {
        type: Date,
      },
      phone_verification_token: {
        type: String,
      },
      phone_verification_expires: {
        type: Date,
      },
    },
    passwordChangedAt: Date,
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

userSchema.pre(/^find/, function (next) {
  this.populate("verification.email")
    .populate("verification.phone_number")
    .populate("verification.image")
    .populate("verification.id_card");
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

userSchema.methods.createToken = function (tokenField) {
  const token = crypto.randomBytes(32).toString("hex");

  this.token[`${tokenField}_token`] = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.token[`${tokenField}_expires`] = Date.now() + 10 * 60 * 1000;

  return token;
};

userSchema.methods.sendEmailVerification = async function (protocol, host) {
  try {
    const emailVerificationToken = this.createToken("email_verification");
    const emailVerificationUrl = `${protocol}://${host}/api/v1/users/verification/verifyEmail/${emailVerificationToken}`;
    await new Email(this).sendEmailVerification(emailVerificationUrl);

    this.verification.email = constants.email.sent;

    return emailVerificationUrl;
  } catch (error) {
    return null;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
