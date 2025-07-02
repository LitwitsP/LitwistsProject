const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const OrderResponse = require("../models/OrderResponse");
const PaymentCapture = require("../models/PaymentCapture"); 
const WebhookPaymentEntity = require("../models/WebhookPaymentEntity");

const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID2,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    logger.info("Received order creation request", { payload: req.body });

    const { amount, currency = "INR" } = req.body;
    const amountInPaise = amount * 100;

    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
    });

    console.log("Razorpay order created:", order);

   
    await Payment.create({
      razorpay_order_id: order.id,
      amount: amount,
      currency: order.currency,
      status: order.status,
      created_at: new Date(order.created_at * 1000),
    });
    logger.info("Razorpay order created ---successfully", {
      orderId: order.id,
      amount_rupees: amount,
    });

    // Save full order in OrderResponse collection
    await OrderResponse.create({
      order_id: order.id,
      payment_id: null,         // to be filled after payment
      amount: amount,           // stored in rupees
      currency: order.currency,
      signature: null,          // to be filled later
      status: order.status,
    });

    logger.info("Order saved to MongoDB", {
      orderId: order.id,
    });

  res.json({
  success: true,
  message: "Razorpay order created successfully by Litwits Pvt. Ltd",
  order: {
    razorpay_order_id: order.id,
    amount: order.amount / 100, 
    currency: order.currency,
    status: order.status,
    created_at: order.created_at,
  },
});


  } catch (error) {
    logger.error("Error creating Razorpay order", { error });
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

    logger.info("Razorpay payment capture response", { response });
    await PaymentCapture.create({
      razorpay_payment_id: response.id,
      amount: response.amount / 100, // convert to rupees
      currency: response.currency,
      status: response.status,
      method: response.method,
      email: response.email,
      contact: response.contact,
    });

    //Update existing Payment document
    const updatedPayment = await Payment.findOneAndUpdate(
      { paymentId },
      { captured: true, status: "captured" },
      { new: true }
    );

    logger.info("Payment captured and saved", { paymentId });

    res.json({
      success: true,
      message: "Payment successfully captured by Litwits Pvt. Ltd",
      capture: response,
    });

  } catch (error) {
    logger.error("Error capturing payment", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// exports.handleWebhook = async (req, res) => {
//   try {
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];
//     const body = JSON.stringify(req.body);

//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(body)
//       .digest("hex");

//     if (signature === expectedSignature) {
//       logger.info("Valid webhook received", { event: req.body.event });

//       const event = req.body.event;
//       if (event === "payment.captured") {
//         const { id, amount, currency } = req.body.payload.payment.entity;

//         await Payment.findOneAndUpdate(
//           { paymentId: id },
//           {
//             status: "captured",
//             captured: true,
//             amount: amount / 100,
//             currency,
//           },
//           { new: true, upsert: true }
//         );

//         logger.info("Payment captured via webhook and updated in DB", { paymentId: id });
//       }

//       res.status(200).json({ received: true });
//     } else {
//       logger.warn("Invalid webhook signature", { headers: req.headers });
//       res.status(400).json({ error: "Invalid webhook signature" });
//     }
//   } catch (error) {
//     logger.error("Error handling webhook", { error: error.message });
//     res.status(500).json({ error: error.message });
//   }
// };
exports.handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = req.rawBody;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const p = req.body.payload.payment.entity;

      await WebhookPaymentEntity.create({
      id: p?.id || null,
      entity: p?.entity || null,
      amount: p?.amount ? p.amount / 100 : null, // rupees
      currency: p?.currency || "INR",
      status: p?.status || null,
      order_id: p?.order_id || null,
      invoice_id: p?.invoice_id || null,
      international: p?.international ?? null,
      method: p?.method || null,
      amount_refunded: p?.amount_refunded || 0,
      refund_status: p?.refund_status || null,
      captured: p?.captured ?? false,
      description: p?.description || "",
      card_id: p?.card_id || null,
      bank: p?.bank || null,
      wallet: p?.wallet || null,
      vpa: p?.vpa || null,
      email: p?.email || "",
      contact: p?.contact || "",
      notes: p?.notes || {},
      fee: p?.fee ? p.fee / 100 : null,
      tax: p?.tax ? p.tax / 100 : null,
      error_code: p?.error_code || null,
      error_description: p?.error_description || null,
      created_at: p?.created_at ? new Date(p.created_at * 1000) : new Date(),
    });
      logger.info("Payment captured via webhook and saved to DB", { paymentId: p.id });

      // Update existing Payment document
      await Payment.findOneAndUpdate(
        { paymentId: p.id },
        {
          status: "captured",
          captured: true,
          amount: p.amount / 100, // convert to rupees
          currency: p.currency,
        },
        { new: true }
      );

    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.status(500).json({ error: error.message });
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
