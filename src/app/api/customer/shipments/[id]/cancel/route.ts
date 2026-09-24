import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customerGuard";
import { cancelShipment } from "@/lib/cancel";

const schema = z.object({
  reason: z.string().trim().min(1, "Please tell us why you're cancelling").max(500),
});

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
  if (shipment.status !== "PENDING") {
    return NextResponse.json(
      {
        error:
          "This shipment can't be cancelled online once it has been picked up — please contact us.",
      },
      { status: 400 }
    );
  }

  const updated = await cancelShipment(id, parsed.data.reason, "CUSTOMER");
  return NextResponse.json({ shipment: updated });
}
