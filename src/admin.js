const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
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
  resources: [User, Trip, Shipment, Status, Review, City],
  rootPath: "/admin",
};

const adminJs = new AdminJS(options);

const adminJsRouter = AdminJSExpress.buildRouter(adminJs);

module.exports = { adminJs, adminJsRouter };
