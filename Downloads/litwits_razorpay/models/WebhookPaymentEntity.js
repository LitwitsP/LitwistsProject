const mongoose = require("mongoose");

const webhookPaymentEntitySchema = new mongoose.Schema({
  id: String,                     // Razorpay payment ID (e.g. pay_xyz)
  entity: String,                 // "payment"
  amount: Number,                 // In paise (you can divide later in UI)
  currency: String,
  status: String,
  order_id: String,
  invoice_id: String,
  international: Boolean,
  method: String,
  amount_refunded: Number,
  refund_status: String,
  captured: Boolean,
  description: String,
  card_id: String,
  bank: String,
  wallet: String,
  vpa: String,
  email: String,
  contact: String,
  notes: mongoose.Schema.Types.Mixed,  // to store shipping address etc.
  fee: Number,
  tax: Number,
  error_code: String,
  error_description: String,
  created_at: Date,
  received_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WebhookPaymentEntity", webhookPaymentEntitySchema);
