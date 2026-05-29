import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, default: "stripe" },
    sessionId: { type: String, required: true, unique: true },
    customerId: { type: String },
    amountTotal: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "expired"],
      default: "pending"
    },
    plan: { type: String, enum: ["premium"], default: "premium" }
  },
  { timestamps: true }
);

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction;
