import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { cancelShipment } from "@/lib/cancel";

const schema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    rejectReason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((d) => d.action !== "REJECT" || !!d.rejectReason, {
    message: "A reason is required when rejecting a cancellation",
    path: ["rejectReason"],
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const request = await prisma.cancellationRequest.findUnique({
    where: { id },
    include: { shipment: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been reviewed" }, { status: 400 });
  }

  if (parsed.data.action === "REJECT") {
    const updated = await prisma.cancellationRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectReason: parsed.data.rejectReason, reviewedAt: new Date() },
    });
    return NextResponse.json({ cancellationRequest: updated });
  }

  if (request.shipment.status === "DELIVERED" || request.shipment.status === "CANCELLED") {
    return NextResponse.json(
      { error: `This shipment is already ${request.shipment.status.toLowerCase()}, so it can't be cancelled` },
      { status: 400 }
    );
  }

  // Marks this (and any other open) request approved as part of cancelling.
  await cancelShipment(request.shipmentId, request.reason, "CUSTOMER");
  const updated = await prisma.cancellationRequest.findUnique({ where: { id } });
  return NextResponse.json({ cancellationRequest: updated });
}
