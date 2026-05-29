const stripeBaseUrl = "https://api.stripe.com/v1";

const ensureStripeKey = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }
};

const stripeRequest = async (path, { method = "GET", body } = {}) => {
  ensureStripeKey();
  const response = await fetch(`${stripeBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Stripe request failed";
    throw new Error(message);
  }

  return payload;
};

export const createStripeCheckoutSession = async (params) => {
  const body = new URLSearchParams(params).toString();
  return stripeRequest("/checkout/sessions", { method: "POST", body });
};

export const getStripeCheckoutSession = async (sessionId) => {
  return stripeRequest(`/checkout/sessions/${sessionId}`);
};
