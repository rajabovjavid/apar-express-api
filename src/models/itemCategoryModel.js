const mongoose = require("mongoose");

const itemCategorySchema = new mongoose.Schema({
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

const ItemCategory = mongoose.model("ItemCategory", itemCategorySchema);

module.exports = ItemCategory;
