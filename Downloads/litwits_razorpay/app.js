require("dotenv").config({ path: ".env" });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const paymentRoutes = require("./routes/paymentRoutes");
const connectDB = require("./mongo_config/db");

const app = express();

// Middleware to capture raw body ONLY for Razorpay Webhook
app.use("/api/payments/webhook", bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Normal JSON parser for all other routes
app.use(bodyParser.json());

// Routes
app.use("/api/payments", paymentRoutes);

// Connect to DB and Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
