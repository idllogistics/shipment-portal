import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";

const schema = z.object({
  reason: z.string().trim().min(1, "Please tell us why you want to cancel").max(500),
});

// Accepted orders can't be cancelled by the customer directly — this files a
// request that staff approve or reject.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { customer, error } = await requireCustomer();
  if (error) return error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment || shipment.customerId !== customer.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") {
    return NextResponse.json(
      { error: `A ${shipment.status.toLowerCase()} shipment can't be cancelled` },
      { status: 400 }
    );
  }

  const open = await prisma.cancellationRequest.findFirst({
    where: { shipmentId: id, status: "PENDING" },
  });
  if (open) {
    return NextResponse.json(
      { error: "A cancellation request for this shipment is already awaiting review" },
      { status: 400 }
    );
  }

  const cancellationRequest = await prisma.cancellationRequest.create({
    data: { shipmentId: id, customerId: customer.id, reason: parsed.data.reason },
  });
  return NextResponse.json({ cancellationRequest }, { status: 201 });
}
