/* eslint-disable no-console */
require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require("./src/app");

// Database
const DB = process.env.LOCAL_DB || process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => console.log("Database connected Successfully"))
  .catch((err) => console.log(err));

const port = process.env.PORT;
const baseUrl = process.env.BASE_URL;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Admin panel: ${baseUrl}admin`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
