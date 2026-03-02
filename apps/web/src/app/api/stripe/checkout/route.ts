import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe, PLANS } from "@/lib/stripe";
import { db, subscriptions, users } from "@supportkit/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  tier: z.enum(["indie", "pro"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as unknown;
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const plan = PLANS[parsed.data.tier];
    if (!plan.priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/billing`,
      metadata: {
        userId: session.user.id,
        tier: parsed.data.tier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
