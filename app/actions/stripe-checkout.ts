"use server";

import { randomUUID } from "node:crypto";
import { setStoryData } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error("STRIPE_PRICE_ID is not set");
}

export async function stripeCheckout({
  storyId: storyIdParam,
  prompt,
}: {
  storyId?: string;
  prompt?: string;
}) {
  const storyId = storyIdParam ?? randomUUID();
  if (prompt !== undefined) {
    setStoryData(storyId, {
      id: storyId,
      title: "Untitled",
      prompt,
      startNodeId: "start",
      nodes: [],
    });
  }
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/edit/${storyId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `Thank you for supporting us! You can now access your story at ${process.env.NEXT_PUBLIC_APP_URL}/edit/${storyId}.`,
        custom_fields: [
          {
            name: "Story edition link",
            value: `${process.env.NEXT_PUBLIC_APP_URL}/edit/${storyId}`,
          },
          {
            name: "Credits added to your story",
            value: "10 credits",
          },
        ],
      },
    },
    metadata: {
      storyId,
    },
  });

  return session.url;
}
