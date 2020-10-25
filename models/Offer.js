const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, maxlength: 50, required: true },
  product_description: { type: String, maxlength: 500, required: true },
  product_price: { type: Number, max: 100000, required: true },
  product_details: Array,
  product_image: { type: Object, default: {} },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = Offer;
