import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { generateTrackingNumber } from "@/lib/tracking";

const updateSchema = z.object({
  action: z.enum(["APPROVE", "DECLINE"]),
  declineReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const orderRequest = await prisma.orderRequest.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!orderRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (orderRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "This request has already been reviewed" },
      { status: 400 }
    );
  }

  if (parsed.data.action === "DECLINE") {
    const updated = await prisma.orderRequest.update({
      where: { id },
      data: {
        status: "DECLINED",
        declineReason: parsed.data.declineReason || null,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ orderRequest: updated });
  }

  let trackingNumber = generateTrackingNumber();
  for (let attempts = 0; attempts < 5; attempts++) {
    const clash = await prisma.shipment.findUnique({ where: { trackingNumber } });
    if (!clash) break;
    trackingNumber = generateTrackingNumber();
  }

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber,
      customerName: orderRequest.customer.name,
      customerEmail: orderRequest.customer.email,
      customerId: orderRequest.customerId,
      origin: orderRequest.origin,
      destination: orderRequest.destination,
      itemDescription: orderRequest.itemDescription,
      itemQuantity: orderRequest.itemQuantity,
      notes: orderRequest.notes,
      events: { create: { status: "PENDING" } },
    },
  });

  const updated = await prisma.orderRequest.update({
    where: { id },
    data: { status: "APPROVED", shipmentId: shipment.id, reviewedAt: new Date() },
  });

  return NextResponse.json({ orderRequest: updated, shipment });
}
