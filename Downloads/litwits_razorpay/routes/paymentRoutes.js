const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  capturePayment,
  handleWebhook,
  listTransactions,
} = require("../controllers/paymentController");

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/capture/:id", capturePayment);
router.post("/webhook", handleWebhook);
router.get("/transactions", listTransactions);

module.exports = router;
