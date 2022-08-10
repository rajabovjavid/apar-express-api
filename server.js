process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require("./src/app");
const connection = require("./src/config/db");

// Database
connection.once("open", () => console.log("Database connected Successfully"));
connection.on("error", (err) => console.log("Error", err));

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Admin panel: http://${host}:${port}/admin`);
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
