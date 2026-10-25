import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const PortalInput = z.object({ workspaceId: z.string() });

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    forbidInDemo(user, "Billing changes");
    const userId = user.id;
    const { workspaceId } = PortalInput.parse(await request.json().catch(() => null));
    await requireWorkspaceRole(userId, workspaceId, ["OWNER", "ADMIN"]);

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Billing portal isn't available in demo mode." },
        { status: 400 },
      );
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    if (!workspace.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account yet — upgrade a plan first." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
