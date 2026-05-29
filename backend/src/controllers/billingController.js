import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { createStripeCheckoutSession, getStripeCheckoutSession } from "../services/billingService.js";

const appUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173";

export const createCheckoutSession = async (req, res) => {
  if (req.user.plan === "premium") {
    return res.status(400).json({ message: "User is already on premium plan" });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    return res.status(503).json({ message: "Billing unavailable: STRIPE_PRICE_ID is not configured" });
  }

  const session = await createStripeCheckoutSession({
    mode: "payment",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    customer_email: req.user.email,
    "metadata[userId]": req.user._id.toString(),
    "metadata[plan]": "premium",
    success_url: `${appUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/app/billing/cancel`
  });

  await PaymentTransaction.findOneAndUpdate(
    { sessionId: session.id },
    {
      user: req.user._id,
      provider: "stripe",
      sessionId: session.id,
      customerId: session.customer,
      amountTotal: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "pending",
      plan: "premium"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ checkoutUrl: session.url });
};

export const getBillingStatus = async (req, res) => {
  const payments = await PaymentTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
  return res.json({ plan: req.user.plan, payments });
};

export const verifyCheckoutSession = async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ message: "session_id is required" });
  }

  const session = await getStripeCheckoutSession(sessionId);
  const isPaid = session.payment_status === "paid" && session.status === "complete";
  const userId = session.metadata?.userId;

  if (!isPaid || !userId || userId !== req.user._id.toString()) {
    return res.status(400).json({ message: "Payment not completed or session does not belong to this user" });
  }

  await User.findByIdAndUpdate(userId, {
    plan: "premium",
    stripeCustomerId: session.customer || null
  });

  await PaymentTransaction.findOneAndUpdate(
    { sessionId: session.id },
    {
      user: userId,
      provider: "stripe",
      sessionId: session.id,
      customerId: session.customer,
      amountTotal: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "succeeded",
      plan: "premium"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ message: "Premium activated" });
};
