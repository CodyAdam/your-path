"use server";

import { randomUUID } from "node:crypto";
import { setStoryData } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error("STRIPE_PRICE_ID is not set");
}

export async function stripeCheckout(prompt: string) {
  const storyId = randomUUID();
  setStoryData(storyId, {
    title: "Untitled",
    prompt,
    startNodeId: "start",
    nodes: [],
  });
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/edit/${storyId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    metadata: {
      storyId,
    },
  });

  return session.url;
}
