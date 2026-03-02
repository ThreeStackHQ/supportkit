import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover" as "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: ["Up to 50 tickets/mo", "Email support", "1 workspace"],
  },
  indie: {
    name: "Indie",
    price: 9,
    priceId: process.env.STRIPE_INDIE_PRICE_ID,
    features: [
      "Unlimited tickets",
      "Email + widget",
      "3 workspaces",
      "Custom branding",
    ],
  },
  pro: {
    name: "Pro",
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "Everything in Indie",
      "AI draft replies",
      "Priority support",
      "Unlimited workspaces",
    ],
  },
} as const;

export type PlanTier = keyof typeof PLANS;
