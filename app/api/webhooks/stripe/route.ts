import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { WorkspacePlan } from "@/lib/generated/prisma/enums";

function planForPriceId(priceId: string | undefined): WorkspacePlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "TEAM";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "AGENCY";
  return null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const plan = session.metadata?.plan as WorkspacePlan | undefined;
      if (workspaceId && plan) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : undefined;
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { plan, stripeSubscriptionId: subscriptionId },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (workspaceId) {
        const priceId = subscription.items.data[0]?.price?.id;
        const plan =
          event.type === "customer.subscription.deleted"
            ? "FREE"
            : (planForPriceId(priceId) ?? "FREE");
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan,
            stripeSubscriptionId:
              event.type === "customer.subscription.deleted" ? null : subscription.id,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
