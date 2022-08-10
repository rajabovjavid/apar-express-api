const mongoose = require("mongoose");

const DB =
  process.env.LOCAL_DB ||
  process.env.DATABASE.replace(
    "<username>",
    process.env.DATABASE_USERNAME
  ).replace("<password>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB);

const { connection } = mongoose;
module.exports = connection;
