import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db, subscriptions } from "@supportkit/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as "indie" | "pro" | undefined;

        if (!userId || !tier) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);

        if (existing) {
          await db
            .update(subscriptions)
            .set({
              tier,
              status: "active",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? null,
              stripeSubscriptionId: subscriptionId ?? null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));
        } else {
          await db.insert(subscriptions).values({
            userId,
            tier,
            status: "active",
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : null,
            stripeSubscriptionId: subscriptionId ?? null,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subId = sub.id;

        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subId))
          .limit(1);

        if (existing) {
          await db
            .update(subscriptions)
            .set({
              status: sub.status,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, subId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subId = sub.id;

        await db
          .update(subscriptions)
          .set({
            tier: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subId));
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
