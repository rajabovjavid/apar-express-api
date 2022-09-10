const mongoose = require("mongoose");

const packageCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      "kitab",
      "sened",
      "qida",
      "medical",
      "kosmetik",
      "elektronik",
      "other",
    ],
  },
});

const PackageCategory = mongoose.model(
  "PackageCategory",
  packageCategorySchema
);

module.exports = PackageCategory;
