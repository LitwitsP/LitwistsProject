const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema({
  event: String,
  payload: mongoose.Schema.Types.Mixed,
  received_at: {
    type: Date,
    default: Date.now,
  },
  headers: mongoose.Schema.Types.Mixed, 
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
