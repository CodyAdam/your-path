import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { incrementStoryCredits } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET must be set");
}

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data
      .object as import("stripe").Stripe.Checkout.Session;
    const storyId = session.metadata?.storyId;

    if (!storyId) {
      console.error("checkout.session.completed missing metadata.storyId");
      return NextResponse.json(
        { error: "Missing storyId in session metadata" },
        { status: 400 }
      );
    }

    try {
      const credits = await incrementStoryCredits(storyId);
      console.log(`Story ${storyId} credits incremented to ${credits}`);
    } catch (err) {
      console.error("Failed to increment story credits:", err);
      return NextResponse.json(
        { error: "Failed to update credits" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
