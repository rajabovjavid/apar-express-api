const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  verificationType: {
    type: String,
    enum: ["email", "phone_number", "image"],
  },
  statusId: String,
  statusText: String,
  statusColor: String,
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
