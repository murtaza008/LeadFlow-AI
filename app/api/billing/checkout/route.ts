import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { getStripe, isStripeConfigured, PLAN_PRICE_ENV } from "@/lib/stripe";

const CheckoutInput = z.object({
  workspaceId: z.string(),
  plan: z.enum(["TEAM", "AGENCY"]),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    forbidInDemo(user, "Stripe checkout and billing changes");
    const userId = user.id;
    const { workspaceId, plan } = CheckoutInput.parse(await request.json().catch(() => null));
    await requireWorkspaceRole(userId, workspaceId, ["OWNER", "ADMIN"]);

    if (!isStripeConfigured()) {
      // Demo mode: no Stripe keys configured, flip the plan instantly so the
      // free stack is fully clickable without a Stripe account.
      await prisma.workspace.update({ where: { id: workspaceId }, data: { plan } });
      return NextResponse.json({ demo: true });
    }

    const priceId = PLAN_PRICE_ENV[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Missing STRIPE_PRICE_${plan} environment variable.` },
        { status: 500 },
      );
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: workspace.name,
        metadata: { workspaceId },
      });
      customerId = customer.id;
      await prisma.workspace.update({ where: { id: workspaceId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/billing?checkout=cancelled`,
      metadata: { workspaceId, plan },
      subscription_data: { metadata: { workspaceId, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
