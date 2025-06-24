
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const paymentRoutes = require("./routes/paymentRoutes");
// const connectDB = require("./config/db");
const connectDB = require("./mongo_config/db");

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/api/payments", paymentRoutes);

// Connect to DB and Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
