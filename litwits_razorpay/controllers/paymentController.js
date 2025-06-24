const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    logger.info("Received order creation request", { payload: req.body });

    const { amount, currency = "INR" } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
    });

    logger.info("Razorpay order created successfully", { orderId: order.id, amount, currency });
    res.json(order);
  } catch (error) {
    logger.error("Error creating Razorpay order", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    logger.info("Received payment verification request", { payload: req.body });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      logger.info("Signature verified successfully", { razorpay_payment_id });

      const payment = new Payment({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        currency,
        status: "verified",
        captured: false,
      });

      await payment.save();
      logger.info("Payment saved to database", { paymentId: razorpay_payment_id });

      res.json({ success: true });
    } else {
      logger.warn("Invalid signature received", { razorpay_payment_id });
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    logger.error("Error verifying payment", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.capturePayment = async (req, res) => {
  try {
    logger.info("Received payment capture request", { params: req.params, body: req.body });

    const paymentId = req.params.id;
    const { amount } = req.body;

    const response = await razorpay.payments.capture(paymentId, amount * 100);

    const updatedPayment = await Payment.findOneAndUpdate(
      { paymentId },
      { captured: true, status: "captured" },
      { new: true }
    );

    logger.info("Payment captured and updated in DB", { paymentId });

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error("Error capturing payment", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature === expectedSignature) {
      logger.info("Valid webhook received", { event: req.body.event });

      const event = req.body.event;
      if (event === "payment.captured") {
        const { id, amount, currency } = req.body.payload.payment.entity;

        await Payment.findOneAndUpdate(
          { paymentId: id },
          {
            status: "captured",
            captured: true,
            amount: amount / 100,
            currency,
          },
          { new: true, upsert: true }
        );

        logger.info("Payment captured via webhook and updated in DB", { paymentId: id });
      }

      res.status(200).json({ received: true });
    } else {
      logger.warn("Invalid webhook signature", { headers: req.headers });
      res.status(400).json({ error: "Invalid webhook signature" });
    }
  } catch (error) {
    logger.error("Error handling webhook", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    logger.info("Fetching transaction list");

    const payments = await Payment.find().sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    logger.error("Error fetching transactions", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
