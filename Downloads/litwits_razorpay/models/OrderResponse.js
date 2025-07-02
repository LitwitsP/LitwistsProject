// models/OrderResponse.js
const mongoose = require("mongoose");

const orderResponseSchema = new mongoose.Schema({
  order_id: String,
  payment_id: String,
  amount: Number,
  currency: String,
  signature: String,
  status: String,
  failure_reason: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// 👇 This line must export the model directly
module.exports = mongoose.model("OrderResponse", orderResponseSchema);
