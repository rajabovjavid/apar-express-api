const MongoStore = require("connect-mongo");
const AdminJS = require("adminjs");
const { buildAuthenticatedRouter } = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");

AdminJS.registerAdapter(AdminJSMongoose);

const User = require("./models/userModel");
const Trip = require("./models/tripModel");
const Shipment = require("./models/shipmentModel");
const Status = require("./models/statusModel");
const Review = require("./models/reviewModel");
const City = require("./models/cityModel");

/** @type {AdminJS.AdminJSOptions} */
const options = {
  branding: { companyName: "Apar Admin" },
  resources: [User, Trip, Shipment, Status, Review, City],
  rootPath: "/admin",
};

const adminJs = new AdminJS(options);

const adminJsRouter = buildAuthenticatedRouter(
  adminJs,
  {
    cookieName: "admin-bro",
    cookiePassword: "superlongandcomplicatedname",
    authenticate: async (email, password) => {
      const user = await User.findOne({ email }).select("+password");

      if (user && (await user.correctPassword(password))) {
        return user.toJSON();
      }
      return null;
    },
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE }),
  }
);

module.exports = { adminJs, adminJsRouter };
