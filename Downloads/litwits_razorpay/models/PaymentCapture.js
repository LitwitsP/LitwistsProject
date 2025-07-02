const mongoose = require("mongoose");

const paymentCaptureSchema = new mongoose.Schema({
  razorpay_payment_id: String,
  amount: Number,           // in rupees
  currency: String,
  status: String,           
  method: String,
  email: String,
  contact: String,
  captured_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PaymentCapture", paymentCaptureSchema);
