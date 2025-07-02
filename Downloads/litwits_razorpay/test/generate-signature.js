const crypto = require("crypto");
const fs = require("fs");
require("dotenv").config({ path: "/home/satish/Downloads/litwits_razorpay/.env" }); // 👈 Load .env file from root

// ✅ Get secret from .env
const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!secret) {
  console.error("❌ Webhook secret not found in .env file");
  process.exit(1);
}

// ✅ Load JSON payload
const payload = fs.readFileSync("test/payload.json", "utf-8");

// ✅ Generate signature
const signature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

console.log("✅ Generated Signature:", signature);

// const crypto = require("crypto");
// const fs = require("fs");


// const webhookSecret =process.env.RAZORPAY_WEBHOOK_SECRET; // Replace with your Razorpay Webhook Secret


// const body = fs.readFileSync("test/payload.json", "utf-8");


// const generatedSignature = crypto
//   .createHmac("sha256", webhookSecret)
//   .update(body)
//   .digest("hex");

// console.log("Generated Signature:", generatedSignature);


//Generated Signature: 3fa5cffac2bd7f5939fef376d381a3c5283049fddbc2891b0e6dc3d9dba148f8